import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { trackOrder } from '../services/orderService';

const TrackOrder: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber) return;
    setIsLoading(true);
    setTrackingData(null);
    try {
      const res = await trackOrder(orderNumber);
      if (res.success && res.data) {
        // Map backend data to UI format
        const order = res.data;
        setTrackingData({
          orderNumber: (order as any).orderNumber || order._id,
          status: (order as any).trackingStatus || order.status,
          estimatedDelivery: (order as any).estimatedDelivery || '',
          items: order.items || [],
          timeline: ((order as any).trackingHistory || []).map((event: any) => ({
            status: event.status || event.activity,
            date: event.date || '',
            time: event.time || '',
            description: event.description || event.status || '',
            completed: event.status?.toLowerCase() === 'delivered',
            icon: event.status?.toLowerCase() === 'delivered' ? CheckCircle : Truck
          }))
        });
      } else {
        setTrackingData(null);
      }
    } catch (err) {
      setTrackingData(null);
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-400';
      case 'in_transit':
        return 'text-ritual-red';
      case 'processing':
        return 'text-antique-gold';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-cinzel text-4xl md:text-5xl text-antique-gold mb-4">
            Track Your Journey
          </h1>
          <p className="font-cormorant text-xl text-gray-300 max-w-2xl mx-auto">
            Follow your sacred artifacts as they travel from The Circle to your realm.
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-md mx-auto mb-12">
          <form onSubmit={handleTrackOrder} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Enter order number (try: IG-2024-001337)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-ash-gray/50 border border-ritual-red/30 rounded-lg text-white placeholder-gray-400 font-cormorant focus:outline-none focus:border-ritual-red"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-ritual-red text-white font-cormorant text-lg hover:bg-blood-red transition-colors duration-300 rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Scrying...' : 'Track Order'}
            </button>
          </form>
        </div>

        {/* Tracking Results */}
        {trackingData && (
          <div className="max-w-4xl mx-auto">
            {/* Order Summary */}
            <div className="bg-ash-gray/30 rounded-lg p-6 border border-ritual-red/20 mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h2 className="font-cinzel text-2xl text-antique-gold mb-2">
                    Order #{trackingData.orderNumber}
                  </h2>
                  <p className={`font-cormorant text-lg ${getStatusColor(trackingData.status)}`}>
                    Status: {trackingData.status.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-cormorant text-gray-300">Estimated Delivery</p>
                  <p className="font-cinzel text-lg text-ritual-red">
                    {new Date(trackingData.estimatedDelivery).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-ritual-red/20 pt-4">
                <h3 className="font-cinzel text-lg text-antique-gold mb-4">Sacred Items</h3>
                <div className="space-y-2">
                  {trackingData.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="font-cormorant text-gray-300">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-cinzel text-ritual-red">
                        ${item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-ash-gray/30 rounded-lg p-6 border border-ritual-red/20">
              <h3 className="font-cinzel text-xl text-antique-gold mb-6">Journey Timeline</h3>
              
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 w-0.5 h-full bg-ritual-red/30"></div>
                
                <div className="space-y-8">
                  {trackingData.timeline.map((event: any, index: number) => {
                    const IconComponent = event.icon;
                    return (
                      <div key={index} className="relative flex items-start">
                        {/* Icon */}
                        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 border-deep-black ${
                          event.completed ? 'bg-ritual-red text-white' : 'bg-ash-gray text-gray-400'
                        }`}>
                          <IconComponent size={20} />
                        </div>
                        
                        {/* Content */}
                        <div className="ml-6 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-cinzel text-lg ${
                              event.completed ? 'text-antique-gold' : 'text-gray-400'
                            }`}>
                              {event.status}
                            </h4>
                            <span className="font-cormorant text-sm text-gray-400">
                              {event.date} {event.time}
                            </span>
                          </div>
                          <p className="font-cormorant text-gray-300">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {orderNumber && !trackingData && !isLoading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔮</div>
            <h3 className="font-cinzel text-xl text-antique-gold mb-2">
              Order Not Found
            </h3>
            <p className="font-cormorant text-gray-400 mb-4">
              The spirits cannot locate this order number. Please check and try again.
            </p>
            <p className="font-cormorant text-sm text-gray-500">
              Try: IG-2024-001337 for a demo
            </p>
          </div>
        )}

        {/* Help Section */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <h3 className="font-cinzel text-xl text-antique-gold mb-4">
            Need Assistance?
          </h3>
          <p className="font-cormorant text-gray-300 mb-6">
            If you're having trouble tracking your order or need to speak with The Circle, 
            we're here to guide you through the shadows.
          </p>
          <button className="px-6 py-3 bg-transparent border border-ritual-red text-ritual-red font-cormorant hover:bg-ritual-red hover:text-white transition-all duration-300 rounded">
            Contact The Circle
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;