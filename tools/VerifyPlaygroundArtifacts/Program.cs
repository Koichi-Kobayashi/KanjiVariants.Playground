using System.Diagnostics;
using System.IO.Compression;
using System.Reflection.Metadata;
using System.Reflection.PortableExecutable;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

var root = Path.GetFullPath(args.Length > 0 ? args[0] : ".");
var strictGit = args.Contains("--git");
var artifactRoot = Option("--artifacts-root") ?? root;
var sourceRoot = Option("--sources-root") ?? root;
var head = Encoding.UTF8.GetString(Git("rev-parse", "HEAD")).Trim();
var records = new List<object>();
foreach (var configuration in new[] { "Debug", "Release" })
{
    var stem = Path.Combine(artifactRoot, "src/KanjiVariants.Playground/bin", configuration, "net10.0/KanjiVariants.Playground");
    var dll = File.ReadAllBytes(stem + ".dll"); var pdb = File.ReadAllBytes(stem + ".pdb");
    InspectBytes(dll); InspectBytes(pdb);
    using var pe = new PEReader(new MemoryStream(dll));
    using var provider = MetadataReaderProvider.FromPortablePdbStream(new MemoryStream(pdb));
    var reader = provider.GetMetadataReader();
    var entry = pe.ReadDebugDirectory().Single(e => e.Type == DebugDirectoryEntryType.CodeView);
    var cv = pe.ReadCodeViewDebugDirectoryData(entry); RequireVirtual(cv.Path);
    var id = new BlobContentId(reader.DebugMetadataHeader!.Id);
    Require(cv.Guid == id.Guid && entry.Stamp == id.Stamp && cv.Age == 1, "DLL/PDB identity mismatch");
    var sourceLinks = new List<string>();
    foreach (var h in reader.CustomDebugInformation)
    {
        var c = reader.GetCustomDebugInformation(h);
        if (reader.GetGuid(c.Kind) != new Guid("cc110556-a091-4d38-9fec-25ab9a351a6a")) continue;
        using var json = JsonDocument.Parse(reader.GetBlobBytes(c.Value));
        foreach (var pair in json.RootElement.GetProperty("documents").EnumerateObject())
        {
            Require(pair.Name == "/_/*", "Unexpected SourceLink key");
            var expected = $"https://raw.githubusercontent.com/Koichi-Kobayashi/KanjiVariants.Playground/{head}/*";
            Require(pair.Value.GetString() == expected, "SourceLink commit/repository mismatch");
            sourceLinks.Add(expected);
        }
    }
    Require(sourceLinks.Count == 1, "Missing/ambiguous SourceLink JSON");
    int tracked = 0, generated = 0;
    foreach (var h in reader.Documents)
    {
        var doc = reader.GetDocument(h); var name = reader.GetString(doc.Name); byte[]? embedded = null;
        foreach (var customHandle in reader.GetCustomDebugInformation(h))
        {
            var c = reader.GetCustomDebugInformation(customHandle);
            if (reader.GetGuid(c.Kind) != new Guid("0e8a571b-6926-466e-b4ad-8ab04611f5fe")) continue;
            var data = reader.GetBlobBytes(c.Value); var length = BitConverter.ToInt32(data, 0);
            if (length == 0) embedded = data[4..];
            else { using var source = new MemoryStream(data, 4, data.Length - 4); using var inflater = new DeflateStream(source, CompressionMode.Decompress); using var result = new MemoryStream(); inflater.CopyTo(result); embedded = result.ToArray(); Require(embedded.Length == length, "Embedded Source length mismatch"); }
        }
        byte[] sourceBytes;
        if (name.StartsWith("/_/", StringComparison.Ordinal))
        {
            var relative = name[3..];
            Require(!relative.Split('/').Contains(".."), "Source path escapes checkout");
            var isTracked = GitExists(relative);
            if (isTracked) { sourceBytes = strictGit ? Git("show", head + ":" + relative) : File.ReadAllBytes(Path.Combine(sourceRoot, relative)); tracked++; }
            else { sourceBytes = embedded ?? File.ReadAllBytes(Path.Combine(root, relative)); generated++; }
        }
        else
        {
            // Razor compiler-generated pseudo-documents are relative logical names,
            // not physical source paths. Require Embedded Source for this case.
            Require(name.StartsWith("Microsoft.NET.Sdk.Razor.SourceGenerators/", StringComparison.Ordinal) && embedded != null, "Nonvirtual document: " + name);
            sourceBytes = embedded!; generated++;
        }
        InspectBytes(sourceBytes);
        var algorithm = reader.GetGuid(doc.HashAlgorithm);
        var hash = algorithm == new Guid("8829d00f-11b8-4213-878b-770e8597ac16") ? SHA256.HashData(sourceBytes)
            : algorithm == new Guid("ff1816ec-aa5e-4d10-87f7-6f4963833460") ? SHA1.HashData(sourceBytes) : throw new InvalidDataException("Unknown checksum algorithm");
        Require(hash.SequenceEqual(reader.GetBlobBytes(doc.Hash)), "Source checksum mismatch: " + name);
        if (embedded != null) Require(embedded.SequenceEqual(sourceBytes), "Embedded Source mismatch: " + name);
    }
    Require(tracked > 0 && generated > 0, "Incomplete document coverage");
    records.Add(new { configuration, commit = head, codeView = cv.Path, tracked, generated, strictGit, sourceLinks, localAbsolutePaths = 0, identityMatches = true, checksumMismatches = 0 });
}
Console.WriteLine(JsonSerializer.Serialize(records, new JsonSerializerOptions { WriteIndented = true }));

string? Option(string name) { var i = Array.IndexOf(args, name); if (i < 0) return null; Require(i + 1 < args.Length, "Missing option value"); return Path.GetFullPath(args[i + 1]); }
byte[] Git(params string[] arguments)
{
    using var p = new Process { StartInfo = new ProcessStartInfo("git") { WorkingDirectory = root, RedirectStandardOutput = true, RedirectStandardError = true, UseShellExecute = false, CreateNoWindow = true } };
    foreach (var a in arguments) p.StartInfo.ArgumentList.Add(a);
    p.Start(); using var output = new MemoryStream(); p.StandardOutput.BaseStream.CopyTo(output); var error = p.StandardError.ReadToEnd(); p.WaitForExit();
    Require(p.ExitCode == 0, "Git source lookup failed: " + error); return output.ToArray();
}
bool GitExists(string relative)
{
    using var p = new Process { StartInfo = new ProcessStartInfo("git") { WorkingDirectory = root, RedirectStandardOutput = true, RedirectStandardError = true, UseShellExecute = false, CreateNoWindow = true } };
    foreach (var a in new[] { "ls-files", "--error-unmatch", "--", relative }) p.StartInfo.ArgumentList.Add(a);
    p.Start(); p.StandardOutput.ReadToEnd(); p.StandardError.ReadToEnd(); p.WaitForExit(); return p.ExitCode == 0;
}
static void InspectBytes(byte[] data)
{
    foreach (var encoding in new[] { Encoding.UTF8, Encoding.Unicode, Encoding.BigEndianUnicode })
        Require(!Regex.IsMatch(encoding.GetString(data), @"(?<![A-Za-z0-9_])[A-Za-z]:[\\/][A-Za-z0-9_. -]+[\\/][A-Za-z0-9_. -]+|(?<![\w/])/(?:Users|home)/"), "Local absolute path in artifact");
}
static void RequireVirtual(string path) => Require(path.Replace('\\', '/').StartsWith("/_/", StringComparison.Ordinal), "Nonvirtual CodeView");
static void Require(bool condition, string message) { if (!condition) throw new InvalidDataException(message); }
