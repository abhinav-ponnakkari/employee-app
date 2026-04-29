using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category)
    {
        var q = db.HrDocuments.AsQueryable();
        if (!string.IsNullOrEmpty(category)) q = q.Where(d => d.Category == category);
        var docs = await q
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new
            {
                d.Id, d.Title, d.Category, d.FileName, d.ContentType,
                d.FileSizeBytes, d.UploadedBy, d.CreatedAt, d.Version
            })
            .ToListAsync();
        return Ok(docs);
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id)
    {
        var doc = await db.HrDocuments.FindAsync(id);
        if (doc == null) return NotFound();
        var bytes = Convert.FromBase64String(doc.FileBase64);
        return File(bytes, doc.ContentType, doc.FileName);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Upload([FromBody] UploadDocumentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FileBase64)) return BadRequest("File content required.");
        var sizeBytes = (long)(req.FileBase64.Length * 0.75);

        var doc = new HrDocument
        {
            Title = req.Title,
            Category = req.Category ?? "General",
            FileName = req.FileName,
            ContentType = req.ContentType,
            FileBase64 = req.FileBase64,
            FileSizeBytes = sizeBytes,
            UploadedBy = User.Identity?.Name ?? "HR",
            Version = req.Version ?? 1
        };
        db.HrDocuments.Add(doc);
        await db.SaveChangesAsync();
        return Ok(new { doc.Id, doc.Title, doc.FileName, doc.FileSizeBytes });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Update(int id, [FromBody] UploadDocumentRequest req)
    {
        var doc = await db.HrDocuments.FindAsync(id);
        if (doc == null) return NotFound();
        doc.Title = req.Title;
        doc.Category = req.Category ?? doc.Category;
        if (!string.IsNullOrEmpty(req.FileBase64))
        {
            doc.FileBase64 = req.FileBase64;
            doc.FileName = req.FileName;
            doc.ContentType = req.ContentType;
            doc.FileSizeBytes = (long)(req.FileBase64.Length * 0.75);
            doc.Version = (doc.Version + 1);
        }
        await db.SaveChangesAsync();
        return Ok(doc);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Delete(int id)
    {
        var doc = await db.HrDocuments.FindAsync(id);
        if (doc == null) return NotFound();
        db.HrDocuments.Remove(doc);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record UploadDocumentRequest(
    string Title, string FileName, string ContentType, string FileBase64,
    string? Category, int? Version);
