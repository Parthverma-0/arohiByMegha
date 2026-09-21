import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../api/products.js';
import { apiErrorMessage } from '../api/client.js';
import MediaUploader from '../components/MediaUploader.jsx';

const emptyForm = { name: '', description: '', image: null, sortOrder: 0, isActive: true };

export default function Categories() {
  const { data: categories = [] } = useAdminCategories();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  function startEdit(cat) {
    setEditing(cat._id);
    setForm({ name: cat.name, description: cat.description, image: cat.image, sortOrder: cat.sortOrder, isActive: cat.isActive });
  }

  function startNew() {
    setEditing('new');
    setForm(emptyForm);
  }

  async function submit(e) {
    e.preventDefault();
    try {
      if (editing === 'new') await createCategory.mutateAsync(form);
      else await updateCategory.mutateAsync({ id: editing, payload: form });
      toast.success('Saved');
      setEditing(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function remove(id) {
    if (!confirm('Delete this category? Products in it will remain but lose their category link.')) return;
    try {
      await deleteCategory.mutateAsync(id);
      toast.success('Deleted');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl">Categories</h1>
        <button className="btn-primary" onClick={startNew}>+ New Category</button>
      </div>

      {editing && (
        <form onSubmit={submit} className="card mb-8 space-y-4 max-w-lg">
          <input required placeholder="Name" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea placeholder="Description" className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <MediaUploader value={form.image} onChange={(image) => setForm({ ...form, image })} folder="categories" label="Category Image" />
          <input type="number" placeholder="Sort order" className="input-field" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
          </label>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      <table className="table-base">
        <thead><tr><th>Name</th><th>Active</th><th></th></tr></thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat._id}>
              <td>{cat.name}</td>
              <td>{cat.isActive ? 'Yes' : 'No'}</td>
              <td className="space-x-3">
                <button className="text-sm underline" onClick={() => startEdit(cat)}>Edit</button>
                <button className="text-sm underline text-red-600" onClick={() => remove(cat._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
