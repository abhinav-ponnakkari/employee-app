namespace EmployeeApi.Models;

public class HrDocument
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Category { get; set; } = "General"; // Policy | Handbook | Form | Announcement | General
    public string FileName { get; set; } = "";
    public string ContentType { get; set; } = "";
    public string FileBase64 { get; set; } = ""; // base64-encoded file content
    public long FileSizeBytes { get; set; }
    public string UploadedBy { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
}
