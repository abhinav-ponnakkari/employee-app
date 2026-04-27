namespace EmployeeApi.Services;

public static class EmailTemplates
{
    private static string Wrap(string title, string body) => $"""
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                <!-- Header -->
                <tr>
                  <td style="background:#1e3a8a;border-radius:12px 12px 0 0;padding:24px 32px;">
                    <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">HR Manager</span>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="background:#1e293b;padding:32px;border-radius:0 0 12px 12px;">
                    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#f1f5f9;">{title}</h2>
                    {body}
                    <hr style="border:none;border-top:1px solid #334155;margin:28px 0 20px;">
                    <p style="margin:0;font-size:12px;color:#64748b;">This is an automated message from HR Manager. Please do not reply to this email.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;

    private static string Row(string label, string value) =>
        $"<tr><td style=\"padding:8px 12px;color:#94a3b8;font-size:13px;width:40%;\">{label}</td><td style=\"padding:8px 12px;color:#f1f5f9;font-size:13px;font-weight:500;\">{value}</td></tr>";

    private static string Badge(string text, string color) =>
        $"<span style=\"display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;background:{color}22;color:{color};\">{text}</span>";

    // ── Leave approved / rejected ────────────────────────────────────────────
    public static (string subject, string html) LeaveStatusUpdate(
        string employeeName, string leaveType, string startDate, string endDate,
        string status, string? reviewNote)
    {
        var isApproved = status == "Approved";
        var color = isApproved ? "#10b981" : "#ef4444";
        var subject = $"Leave Request {status} — {leaveType}";

        var noteRow = !string.IsNullOrEmpty(reviewNote)
            ? $"<tr><td colspan=\"2\" style=\"padding:8px 12px;\"><span style=\"color:#94a3b8;font-size:13px;\">Note: </span><span style=\"color:#f1f5f9;font-size:13px;\">{reviewNote}</span></td></tr>"
            : "";

        var body = $"""
            <p style="color:#cbd5e1;font-size:14px;margin:0 0 20px;">Hi {employeeName}, your leave request has been reviewed.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:8px;margin-bottom:20px;">
              {Row("Status", Badge(status, color))}
              {Row("Leave Type", leaveType)}
              {Row("From", startDate)}
              {Row("To", endDate)}
              {noteRow}
            </table>
            {(isApproved
                ? "<p style=\"color:#10b981;font-size:13px;margin:0;\">Enjoy your time off!</p>"
                : "<p style=\"color:#94a3b8;font-size:13px;margin:0;\">You may submit a new request or contact HR if you have questions.</p>")}
            """;

        return (subject, Wrap(subject, body));
    }

    // ── Payslip ──────────────────────────────────────────────────────────────
    public static (string subject, string html) Payslip(
        string employeeName, string monthYear, decimal baseSalary,
        decimal totalAllowances, decimal totalDeductions, decimal netPay)
    {
        var subject = $"Your Payslip for {monthYear} — HR Manager";

        var body = $"""
            <p style="color:#cbd5e1;font-size:14px;margin:0 0 20px;">Hi {employeeName}, your payslip for <strong style="color:#f1f5f9;">{monthYear}</strong> is ready.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:8px;margin-bottom:20px;">
              {Row("Base Salary", $"${baseSalary:N2}")}
              {Row("Total Allowances", $"<span style=\"color:#10b981;\">+ ${totalAllowances:N2}</span>")}
              {Row("Total Deductions", $"<span style=\"color:#ef4444;\">− ${totalDeductions:N2}</span>")}
              <tr><td colspan="2" style="padding:4px;"></td></tr>
              <tr style="border-top:1px solid #334155;">
                <td style="padding:12px;color:#f1f5f9;font-size:15px;font-weight:700;">Net Pay</td>
                <td style="padding:12px;color:#3b82f6;font-size:15px;font-weight:700;">${netPay:N2}</td>
              </tr>
            </table>
            <p style="color:#94a3b8;font-size:13px;margin:0;">Log in to HR Manager to view your full payslip and download it.</p>
            """;

        return (subject, Wrap(subject, body));
    }

    // ── New circular ─────────────────────────────────────────────────────────
    public static (string subject, string html) NewCircular(string title, string content, string postedBy, string date)
    {
        var subject = $"New Announcement: {title}";

        var body = $"""
            <p style="color:#cbd5e1;font-size:14px;margin:0 0 16px;">A new company announcement has been published.</p>
            <div style="background:#0f172a;border-left:3px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:20px;">
              <p style="color:#f1f5f9;font-size:15px;font-weight:600;margin:0 0 10px;">{title}</p>
              <p style="color:#cbd5e1;font-size:14px;margin:0;line-height:1.6;">{content}</p>
            </div>
            <p style="color:#64748b;font-size:12px;margin:0;">Posted by {postedBy} on {date}</p>
            """;

        return (subject, Wrap(subject, body));
    }

    // ── Welcome email ────────────────────────────────────────────────────────
    public static (string subject, string html) Welcome(string displayName, string username, string role)
    {
        var subject = "Welcome to HR Manager";

        var body = $"""
            <p style="color:#cbd5e1;font-size:14px;margin:0 0 20px;">Hi {displayName}, your HR Manager account has been created. Here are your login details:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:8px;margin-bottom:20px;">
              {Row("Username", $"<strong>{username}</strong>")}
              {Row("Role", Badge(role, role == "Admin" ? "#8b5cf6" : role == "HR" ? "#3b82f6" : "#10b981"))}
            </table>
            <p style="color:#f59e0b;font-size:13px;margin:0 0 8px;">Your administrator has set your initial password. Please log in and change it immediately.</p>
            <p style="color:#94a3b8;font-size:13px;margin:0;">If you did not expect this email, please contact your HR department.</p>
            """;

        return (subject, Wrap(subject, body));
    }

    // ── Password reset ───────────────────────────────────────────────────────
    public static (string subject, string html) PasswordReset(string displayName)
    {
        var subject = "Your HR Manager Password Has Been Reset";

        var body = $"""
            <p style="color:#cbd5e1;font-size:14px;margin:0 0 20px;">Hi {displayName},</p>
            <p style="color:#cbd5e1;font-size:14px;margin:0 0 20px;">Your HR Manager password has been reset by an administrator. Please log in with your new password as soon as possible.</p>
            <p style="color:#f59e0b;font-size:13px;margin:0;">If you did not request this change, please contact your HR department immediately.</p>
            """;

        return (subject, Wrap(subject, body));
    }
}
