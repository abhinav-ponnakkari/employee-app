using System.Net.Http.Headers;
using System.Text.Json;

namespace EmployeeApi.Services;

public class ChatService
{
    private readonly IHttpClientFactory _http;
    private readonly string _apiKey;

    public ChatService(IHttpClientFactory http, IConfiguration config)
    {
        _http = http;
        _apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                  ?? config["Anthropic:ApiKey"]
                  ?? "";
    }

    public bool IsConfigured => !string.IsNullOrEmpty(_apiKey);

    public async Task<string> GetReplyAsync(string systemPrompt, IEnumerable<(string Role, string Content)> history)
    {
        if (!IsConfigured)
            return "The HR Assistant is not configured yet. Please ask your administrator to set up the API key.";

        var client = _http.CreateClient();
        client.DefaultRequestHeaders.Add("x-api-key", _apiKey);
        client.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

        var body = new
        {
            model = "claude-haiku-4-5-20251001",
            max_tokens = 1024,
            system = systemPrompt,
            messages = history.Select(m => new { role = m.Role, content = m.Content }).ToList(),
        };

        var response = await client.PostAsJsonAsync("https://api.anthropic.com/v1/messages", body);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Anthropic API error {response.StatusCode}: {err}");
            return "Sorry, I couldn't process your request right now. Please try again later.";
        }

        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement
                   .GetProperty("content")[0]
                   .GetProperty("text")
                   .GetString() ?? "";
    }
}
