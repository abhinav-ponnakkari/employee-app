using System.Net;
using System.Net.Mail;

namespace EmployeeApi.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrEmpty(Get("Username"));

    private string Get(string key) =>
        Environment.GetEnvironmentVariable($"EMAIL_{key.ToUpper()}") ?? _config[$"Email:{key}"] ?? "";

    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        if (string.IsNullOrWhiteSpace(to)) return;
        if (!IsConfigured)
        {
            _logger.LogWarning("Email not configured — skipping send to {To}: {Subject}", to, subject);
            return;
        }

        try
        {
            var host = Get("SmtpHost");
            var port = int.TryParse(Get("SmtpPort"), out var p) ? p : 587;
            var username = Get("Username");
            var password = Get("Password");
            var fromName = Get("FromName") is { Length: > 0 } n ? n : "HR Manager";

#pragma warning disable SYSLIB0006
            using var client = new SmtpClient(host, port)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(username, password),
                DeliveryMethod = SmtpDeliveryMethod.Network,
            };
#pragma warning restore SYSLIB0006

            using var msg = new MailMessage
            {
                From = new MailAddress(username, fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true,
            };
            msg.To.Add(to);

            await client.SendMailAsync(msg);
            _logger.LogInformation("Email sent to {To}: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}: {Subject}", to, subject);
        }
    }

    public async Task SendToManyAsync(IEnumerable<string> recipients, string subject, string htmlBody)
    {
        foreach (var to in recipients.Where(r => !string.IsNullOrWhiteSpace(r)))
            await SendAsync(to, subject, htmlBody);
    }
}
