import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminProducts, useDeleteProduct } from '../api/products.js';
import { apiErrorMessage } from '../api/client.js';

function formatINR(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export default function Products() {
  const { data, isLoading } = useAdminProducts({ limit: 100 });
  const deleteProduct = useDeleteProduct();

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
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
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
