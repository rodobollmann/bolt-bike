import React, { useState, useEffect } from 'react';
    import { v4 as uuidv4 } from 'uuid';
    import { useNavigate, useParams } from 'react-router-dom';
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    function MaintenanceForm() {
      const navigate = useNavigate();
      const { clientId } = useParams();
      const [bike, setBike] = useState({
        model: '',
        owner: '',
      });
      const [maintenances, setMaintenances] = useState([]);
      const [paymentMethod, setPaymentMethod] = useState('none');
      const [isPaid, setIsPaid] = useState(false);
      const [quoteStatus, setQuoteStatus] = useState('none');
      const [initialTotal, setInitialTotal] = useState(0);
      const [quoteValue, setQuoteValue] = useState('');
      const [discountPercentage, setDiscountPercentage] = useState('');

      useEffect(() => {
        const fetchClient = async () => {
          if (clientId) {
            const { data, error } = await supabase
              .from('clients')
              .select('*')
              .eq('id', clientId)
              .single();

            if (error) {
              console.error('Error fetching client:', error);
              return;
            }

            if (data) {
              setBike(data.bike);
              setMaintenances(data.maintenances);
              setPaymentMethod(data.paymentMethod);
              setIsPaid(data.isPaid || false);
              setQuoteStatus(data.quoteStatus);
              setInitialTotal(data.quoteStatus === 'completed' ? -5000 : 0);
              setQuoteValue(data.quoteValue || '');
              setDiscountPercentage(data.discountPercentage || '');
            }
          }
        };

        fetchClient();
      }, [clientId]);

      const handleBikeChange = (e) => {
        setBike({ ...bike, [e.target.name]: e.target.value });
      };

      const addMaintenance = () => {
        const newMaintenance = {
          id: uuidv4(),
          description: '',
          items: '',
          price: 0,
        };
        setMaintenances([...maintenances, newMaintenance]);
      };

      const handleMaintenanceChange = (id, field, value) => {
        setMaintenances(
          maintenances.map((maintenance) =>
            maintenance.id === id ? { ...maintenance, [field]: value } : maintenance,
          ),
        );
      };

      const editMaintenance = (id) => {
        const maintenanceToEdit = maintenances.find((maintenance) => maintenance.id === id);
        if (maintenanceToEdit) {
          const updatedMaintenances = maintenances.map((maintenance) =>
            maintenance.id === id ? { ...maintenance, isEditing: true } : maintenance,
          );
          setMaintenances(updatedMaintenances);
        }
      };

      const saveMaintenance = (id) => {
        const updatedMaintenances = maintenances.map((maintenance) =>
          maintenance.id === id ? { ...maintenance, isEditing: false } : maintenance,
        );
        setMaintenances(updatedMaintenances);
      };

      const deleteMaintenance = (id) => {
        setMaintenances(maintenances.filter((maintenance) => maintenance.id !== id));
      };

      const calculateTotal = () => {
        // Validar y calcular el total base de los mantenimientos
        const total = (Array.isArray(maintenances) ? maintenances : [])
          .reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);

        let discountedTotal = total;
        let quoteDiscount = 0;
        
        if (quoteValue) {
          discountedTotal -= parseFloat(quoteValue);
          quoteDiscount = -parseFloat(quoteValue);
        }

        let paymentDiscount = 0;
        let finalTotal = discountedTotal;
        if (paymentMethod === 'cash' || paymentMethod === 'transfer' && discountPercentage) {
          paymentDiscount = discountedTotal * (parseFloat(discountPercentage) / 100);
          finalTotal = discountedTotal - paymentDiscount;
        }

        // Sumar el total inicial
        const finalTotalWithInitial = finalTotal + (parseFloat(initialTotal) || 0);

        return {
          total,
          quoteDiscount,
          paymentDiscount,
          finalTotal: finalTotalWithInitial.toFixed(2),
        };
      };

      const { total, quoteDiscount, paymentDiscount, finalTotal } = calculateTotal();

      const handleAccept = async () => {
        const totalToSave = calculateTotal().finalTotal;
        const newClient = {
          id: clientId || uuidv4(),
          bike,
          maintenances,
          paymentMethod,
          total: totalToSave,
          isPaid,
          quoteStatus: clientId && quoteStatus === 'pending' ? 'completed' : quoteStatus,
          quoteValue: parseFloat(quoteValue) || 0,
          discountPercentage: parseFloat(discountPercentage) || 0,
        };

        if (clientId) {
          const { error } = await supabase
            .from('clients')
            .update(newClient)
            .eq('id', clientId);

          if (error) {
            console.error('Error updating client:', error);
            return;
          }
        } else {
          const { error } = await supabase.from('clients').insert([newClient]);
          if (error) {
            console.error('Error creating client:', error);
            return;
          }
        }
        navigate('/');
      };

      const handleCancel = () => {
        navigate('/');
      };

      return (
        <div className="container">
          <h1>Bike Maintenance System</h1>
          <div className="form-group">
            <label>Bike Model</label>
            <input
              type="text"
              name="model"
              value={bike.model}
              onChange={handleBikeChange}
              placeholder="Enter bike model"
            />
          </div>
          <div className="form-group">
            <label>Owner</label>
            <input
              type="text"
              name="owner"
              value={bike.owner}
              onChange={handleBikeChange}
              placeholder="Enter owner name"
            />
          </div>
          <h2>Maintenance List</h2>
          <button onClick={addMaintenance}>Add Maintenance</button>
          <div className="maintenance-list">
            {maintenances.map((maintenance) => (
              <div key={maintenance.id} className="maintenance-item">
                {maintenance.isEditing ? (
                  <>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={maintenance.description}
                        onChange={(e) =>
                          handleMaintenanceChange(maintenance.id, 'description', e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Items</label>
                      <textarea
                        value={maintenance.items}
                        onChange={(e) =>
                          handleMaintenanceChange(maintenance.id, 'items', e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Price</label>
                      <input
                        type="number"
                        value={maintenance.price}
                        onChange={(e) =>
                          handleMaintenanceChange(maintenance.id, 'price', e.target.value)
                        }
                      />
                    </div>
                    <button className="edit" onClick={() => saveMaintenance(maintenance.id)}>
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <h4>Maintenance #{maintenances.indexOf(maintenance) + 1}</h4>
                    <p>
                      <strong>Description:</strong> {maintenance.description}
                    </p>
                    <p>
                      <strong>Items:</strong> {maintenance.items}
                    </p>
                    <p>
                      <strong>Price:</strong> ${maintenance.price}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <button className="edit" onClick={() => editMaintenance(maintenance.id)}>
                        Edit
                      </button>
                      <button className="delete" onClick={() => deleteMaintenance(maintenance.id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="total-section">
            <h3>Total</h3>
            <p>
              <strong>Subtotal Mantenimientos:</strong> ${total.toFixed(2)}
            </p>
            <div className="form-group">
              <label>Valor Cotización</label>
              <input
                type="number"
                value={quoteValue}
                onChange={(e) => setQuoteValue(e.target.value)}
                placeholder="Ingrese valor de cotización"
              />
            </div>
            {quoteValue !== '' && (
              <p>
                <strong>Descuento Cotización:</strong> ${quoteDiscount.toFixed(2)}
              </p>
            )}
            <div className="form-group">
              <label>Descuento %</label>
              <input
                type="number"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                placeholder="Ingrese porcentaje de descuento"
              />
            </div>
            {paymentMethod === 'cash' || paymentMethod === 'transfer' ? (
              <p>
                <strong>Descuento por método de pago:</strong> -${paymentDiscount.toFixed(2)}
              </p>
            ) : null}
            <p>
              <strong>Total:</strong> ${finalTotal}
            </p>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="none">None</option>
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>
          <div className="paid-section">
            <div className="checkbox-container">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
              />
              <label>Paid</label>
            </div>
          </div>
          <button onClick={handleAccept}>Accept</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      );
    }

    export default MaintenanceForm;
