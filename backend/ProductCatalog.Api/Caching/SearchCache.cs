using System.Collections.Concurrent;
using ProductCatalog.Api.Dtos;

namespace ProductCatalog.Api.Caching;

/* In-memory cache for search results. Keyed on the search query string
   simple caching layer for search results using dictionary */
public class SearchCache
{
    private readonly ConcurrentDictionary<string, CacheEntry> _store = new();
    private readonly TimeSpan _ttl;

    public SearchCache(TimeSpan? ttl = null)
    {
        _ttl = ttl ?? TimeSpan.FromSeconds(30);
    }

    // Get a cached result. Return null if missing or expired
    public PagedResult<ProductDto>? TryGet(string key)
    {
        if (_store.TryGetValue(key, out var entry))
        {
            if (entry.ExpiresAt > DateTime.UtcNow)
            {
                return entry.Value;
            }
            // Expired: remove so the dictionary doesn't grow.
            _store.TryRemove(key, out _);
        }
        return null;
    }

    // Cache result
    public void Set(string key, PagedResult<ProductDto> value)
    {
        _store[key] = new CacheEntry(value, DateTime.UtcNow.Add(_ttl));
    }

    public void Clear() => _store.Clear();

    private sealed record CacheEntry(PagedResult<ProductDto> Value, DateTime ExpiresAt);
}
