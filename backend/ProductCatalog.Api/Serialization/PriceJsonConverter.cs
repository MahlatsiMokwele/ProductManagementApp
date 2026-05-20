using System.Text.Json;
using System.Text.Json.Serialization;

namespace ProductCatalog.Api.Serialization;

// Custom JSON converter 
public class PriceJsonConverter : JsonConverter<decimal>
{
    public override decimal Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        // Accept either a JSON number or a string. Helpful when the frontend posts eg "19.99" rather than 19.99
        if (reader.TokenType == JsonTokenType.String)
        {
            var s = reader.GetString();
            if (decimal.TryParse(s, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var parsed))
                return parsed;
            throw new JsonException($"Cannot parse '{s}' as a decimal.");
        }
        return reader.GetDecimal();
    }

    public override void Write(Utf8JsonWriter writer, decimal value, JsonSerializerOptions options)
    {
        // exactly two decimal places 19.90 will not be 19,90 for example
        writer.WriteRawValue(value.ToString("F2", System.Globalization.CultureInfo.InvariantCulture));
    }
}
