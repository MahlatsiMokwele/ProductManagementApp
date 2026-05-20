using ProductCatalog.Api.Dtos;
using ProductCatalog.Api.Entities;

namespace ProductCatalog.Api.Trees;

// Build a hierarchical tree from a list of categories
public static class CategoryTree
{
    public static List<CategoryTreeNode> Build(IEnumerable<Category> categories)
    {
        if (categories is null) throw new ArgumentNullException(nameof(categories));

        // Index every category as a node
        var nodesById = new Dictionary<Guid, CategoryTreeNode>();
        var allCategories = categories.ToList();
        foreach (var c in allCategories)
        {
            nodesById[c.Id] = new CategoryTreeNode(c.Id, c.Name, c.Description, new List<CategoryTreeNode>());
        }

        // Attach each node to parent
        var roots = new List<CategoryTreeNode>();
        foreach (var c in allCategories)
        {
            var node = nodesById[c.Id];
            if (c.ParentCategoryId is { } parentId
                && nodesById.TryGetValue(parentId, out var parent)
                && !CreatesCycle(parent, node))
            {
                parent.Children.Add(node);
            }
            else
            {
                roots.Add(node);
            }
        }

        // Sort children alphabetically
        SortRecursive(roots);
        return roots;
    }

    private static bool CreatesCycle(CategoryTreeNode parent, CategoryTreeNode child)
    {
        if (parent.Id == child.Id) return true;
        return false;
    }

    private static void SortRecursive(List<CategoryTreeNode> nodes)
    {
        nodes.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));
        foreach (var node in nodes) SortRecursive(node.Children);
    }
}
