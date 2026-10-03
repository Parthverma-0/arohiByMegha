import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminProducts, useDeleteProduct, useUpdateProduct } from '../api/products.js';
import { apiErrorMessage } from '../api/client.js';

function formatINR(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export default function Products() {
  const { data, isLoading } = useAdminProducts({ limit: 100 });
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  async function toggleVisibility(p) {
    try {
      await updateProduct.mutateAsync({ id: p._id, payload: { isActive: !p.isActive } });
      toast.success(p.isActive ? `"${p.name}" is now hidden from the website` : `"${p.name}" is now live on the website`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function remove(id) {
    if (!confirm('Delete this product permanently?')) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Deleted');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl">Products</h1>
        <Link to="/products/new" className="btn-primary">+ New Product</Link>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table className="table-base">
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Website</th><th></th></tr></thead>
          <tbody>
            {data?.products.map((p) => (
              <tr key={p._id}>
                <td>
                  {p.images?.[0]?.url ? (
                    <img src={p.images[0].url} alt="" className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-blush rounded" />
                  )}
                </td>
                <td>{p.name}</td>
                <td>{p.category?.name}</td>
                <td>{formatINR(p.price)}</td>
                <td className={p.stock <= 5 ? 'text-red-600' : ''}>{p.stock}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => toggleVisibility(p)}
                    disabled={updateProduct.isPending}
                    title={p.isActive ? 'Click to hide from the website' : 'Click to show on the website'}
                    className={`text-xs px-2.5 py-1 rounded-full border ${p.isActive ? 'border-green-600 text-green-700 bg-green-50' : 'border-red-300 text-red-700 bg-red-50'}`}
                  >
                    {p.isActive ? 'Live' : 'Hidden'}
                  </button>
                </td>
                <td className="space-x-3">
                  <Link to={`/products/${p._id}/edit`} className="text-sm underline">Edit</Link>
                  <button className="text-sm underline text-red-600" onClick={() => remove(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
