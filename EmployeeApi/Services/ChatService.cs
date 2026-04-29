using System.Text.Json;

namespace EmployeeApi.Services;

public class ChatService
{
    private readonly IHttpClientFactory _http;
    private readonly string _apiKey;

    public ChatService(IHttpClientFactory http, IConfiguration config)
    {
        _http = http;
        _apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY")
                  ?? config["Groq:ApiKey"]
                  ?? "";
    }

    public bool IsConfigured => !string.IsNullOrEmpty(_apiKey);

    public async Task<string> GetReplyAsync(string systemPrompt, IEnumerable<(string Role, string Content)> history)
    {
        if (!IsConfigured)
            return "The HR Assistant is not configured yet. Please ask your administrator to add the GROQ_API_KEY.";

        var client = _http.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");

        var messages = new List<object>
        {
            new { role = "system", content = systemPrompt }
        };
        messages.AddRange(history.Select(m => (object)new { role = m.Role, content = m.Content }));

        var body = new
        {
            model = "llama-3.1-8b-instant",
            max_tokens = 1024,
            messages,
        };

        var response = await client.PostAsJsonAsync("https://api.groq.com/openai/v1/chat/completions", body);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Groq API error {response.StatusCode}: {err}");
            return "Sorry, I couldn't process your request right now. Please try again later.";
        }

        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement
                   .GetProperty("choices")[0]
                   .GetProperty("message")
                   .GetProperty("content")
                   .GetString() ?? "";
    }

    public async Task<string> GetInsightAsync(string prompt)
    {
        if (!IsConfigured) return "AI insights not configured. Add GROQ_API_KEY to enable.";
        return await GetReplyAsync("You are an HR analytics assistant providing concise, actionable insights.", [("user", prompt)]);
    }
}
