namespace ProductCatalog.Api.Search;

public sealed class SearchableField<T>
{
    public Func<T, string?> Selector { get; }
    public double Weight { get; }

    public SearchableField(Func<T, string?> selector, double weight)
    {
        Selector = selector ?? throw new ArgumentNullException(nameof(selector));
        if (weight <= 0) throw new ArgumentOutOfRangeException(nameof(weight), "Weight must be > 0.");
        Weight = weight;
    }
}

public sealed record SearchResult<T>(T Item, double Score);

public sealed class ProductSearchEngine<T>
{
    private readonly IReadOnlyList<SearchableField<T>> _fields;
    private readonly double _fuzzyThreshold;

    public ProductSearchEngine(IEnumerable<SearchableField<T>> fields, double fuzzyThreshold = 0.6)
    {
        _fields = fields?.ToList() ?? throw new ArgumentNullException(nameof(fields));
        if (_fields.Count == 0) throw new ArgumentException("At least one field is required.", nameof(fields));
        if (fuzzyThreshold is < 0 or > 1)
            throw new ArgumentOutOfRangeException(nameof(fuzzyThreshold), "Must be between 0 and 1.");
        _fuzzyThreshold = fuzzyThreshold;
    }

    public IEnumerable<SearchResult<T>> Search(string? query, IEnumerable<T> items)
    {
        if (items is null) throw new ArgumentNullException(nameof(items));
        if (string.IsNullOrWhiteSpace(query))
        {
            return items.Select(i => new SearchResult<T>(i, 0.0));
        }

        var queryTerms = Tokenize(query);
        var totalWeight = _fields.Sum(f => f.Weight) * queryTerms.Count;

        var results = new List<SearchResult<T>>();
        foreach (var item in items)
        {
            double itemScore = 0;
            foreach (var term in queryTerms)
            {
                foreach (var field in _fields)
                {
                    var text = field.Selector(item);
                    if (string.IsNullOrEmpty(text)) continue;

                    var fieldScore = ScoreFieldAgainstTerm(text, term);
                    itemScore += fieldScore * field.Weight;
                }
            }

            var normalised = totalWeight > 0 ? itemScore / totalWeight : 0;
            if (normalised > 0)
            {
                results.Add(new SearchResult<T>(item, normalised));
            }
        }

        return results.OrderByDescending(r => r.Score);
    }

    private double ScoreFieldAgainstTerm(string fieldText, string term)
    {
        var loweredField = fieldText.ToLowerInvariant();
        var loweredTerm = term.ToLowerInvariant();

        if (loweredField.Contains(loweredTerm, StringComparison.Ordinal))
        {
            return 1.0;
        }

        // Fuzzy path: best similarity over the field's tokens
        double best = 0;
        foreach (var token in Tokenize(loweredField))
        {
            var sim = Similarity(loweredTerm, token);
            if (sim > best) best = sim;
        }
        return best >= _fuzzyThreshold ? best : 0;
    }

    private static List<string> Tokenize(string text) =>
        text.Split(new[] { ' ', '\t', '\r', '\n', '-', '_', ',', '.', '/', '\\' },
                   StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

    private static double Similarity(string a, string b)
    {
        if (a.Length == 0 && b.Length == 0) return 1.0;
        if (a.Length == 0 || b.Length == 0) return 0.0;

        var distance = LevenshteinDistance(a, b);
        var maxLen = Math.Max(a.Length, b.Length);
        return 1.0 - (double)distance / maxLen;
    }

    internal static int LevenshteinDistance(string a, string b)
    {
        var previous = new int[b.Length + 1];
        var current = new int[b.Length + 1];

        for (int j = 0; j <= b.Length; j++) previous[j] = j;

        for (int i = 1; i <= a.Length; i++)
        {
            current[0] = i;
            for (int j = 1; j <= b.Length; j++)
            {
                int cost = a[i - 1] == b[j - 1] ? 0 : 1;
                current[j] = Math.Min(
                    Math.Min(current[j - 1] + 1, previous[j] + 1),
                    previous[j - 1] + cost);
            }
            (previous, current) = (current, previous);
        }
        return previous[b.Length];
    }
}
