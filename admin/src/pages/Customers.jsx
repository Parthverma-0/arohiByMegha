import { useAdminCustomers } from '../api/misc.js';

export default function Customers() {
  const { data, isLoading } = useAdminCustomers();

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Customers</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table className="table-base">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Marketing Consent</th><th>Joined</th></tr></thead>
          <tbody>
            {data.customers.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td>{c.marketingConsent ? 'Yes' : 'No'}</td>
                <td>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
