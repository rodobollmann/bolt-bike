import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { v4 as uuidv4 } from 'uuid';
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    function ClientList() {
      const navigate = useNavigate();
      const [clients, setClients] = useState([]);
      const [paymentFilter, setPaymentFilter] = useState('all');
      const [searchQuery, setSearchQuery] = useState('');

      useEffect(() => {
        const fetchClients = async () => {
          const { data, error } = await supabase.from('clients').select('*');
          if (error) {
            console.error('Error fetching clients:', error);
          } else {
            setClients(data);
          }
        };

        fetchClients();
      }, []);

      const handleQuoteClient = async () => {
         const newClient = {
          id: uuidv4(),
          bike: { model: '', owner: '' },
          maintenances: [],
          paymentMethod: 'none',
          total: 5000,
          isPaid: false,
          quoteStatus: 'pending',
          quoteValue: 0,
          discountPercentage: 0,
        };
        const { error } = await supabase.from('clients').insert([newClient]);
        if (error) {
          console.error('Error creating quote client:', error);
        }
        navigate(0);
      };

      const handleCreateMaintenance = async () => {
        const newClient = {
          id: uuidv4(),
          bike: { model: '', owner: '' },
          maintenances: [],
          paymentMethod: 'none',
          total: 0,
          isPaid: false,
          quoteStatus: 'none',
          quoteValue: 0,
          discountPercentage: 0,
        };
        const { error } = await supabase.from('clients').insert([newClient]);
        if (error) {
          console.error('Error creating maintenance client:', error);
        }
        navigate(0);
      };

      const handleEditClient = (clientId) => {
        navigate(`/edit/${clientId}`);
      };

      const handleDeleteClient = async (clientId) => {
        const { error } = await supabase.from('clients').delete().eq('id', clientId);
        if (error) {
          console.error('Error deleting client:', error);
        }
        navigate(0);
      };

      const filteredClients = clients.filter((client) => {
        const paymentMatch =
          paymentFilter === 'all' ||
          (paymentFilter === 'paid' && client.isPaid) ||
          (paymentFilter === 'unpaid' && !client.isPaid);

        const searchMatch =
          searchQuery === '' ||
          client.bike.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.bike.model.toLowerCase().includes(searchQuery.toLowerCase());

        return paymentMatch && searchMatch;
      });

      return (
        <div className="client-list-container">
          <h2>Client List</h2>
          <div className="filter-container">
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <input
              type="text"
              placeholder="Search by owner or bike"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={handleQuoteClient} className="quote-button">Generate Quote</button>
          <button onClick={handleCreateMaintenance}>Create Maintenance</button>
          {filteredClients.map((client) => (
            <div key={client.id} className="client-item">
              <div>
                <h3>
                  {client.bike.owner}
                  <span className={client.isPaid ? 'paid' : 'unpaid'}>
                    {client.isPaid ? ' Paid' : ' Unpaid'}
                  </span>
                  {client.quoteStatus === 'pending' && (
                    <span style={{ marginLeft: '10px', color: 'orange', fontWeight: 'bold' }}>
                      Quote Pending
                    </span>
                  )}
                  {client.quoteStatus === 'completed' && (
                    <span style={{ marginLeft: '10px', color: 'blue', fontWeight: 'bold' }}>
                      Quote Completed
                    </span>
                  )}
                </h3>
                <p>
                  <strong>Bike:</strong> {client.bike.model}
                </p>
                <p>
                  <strong>Total:</strong> ${client.total}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={() => handleEditClient(client.id)}>Select</button>
                <button
                  style={{ backgroundColor: '#e74c3c', marginLeft: '5px' }}
                  onClick={() => handleDeleteClient(client.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    export default ClientList;
