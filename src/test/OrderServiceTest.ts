import OrderService from '@/services/OrderService';

// Test function to verify order data fetching
async function testOrderFetching() {
  try {
    console.log('Testing order fetching...');
    
    // Test getAllOrdersForAdmin
    console.log('Fetching all orders for admin...');
    const adminOrders = await OrderService.getAllOrdersForAdmin();
    console.log('Admin orders fetched:', adminOrders.length);
    
    if (adminOrders.length > 0) {
      const firstOrder = adminOrders[0];
      console.log('First order details:', {
        id: firstOrder.id,
        orderNumber: firstOrder.order_number,
        itemsCount: firstOrder.order_items?.length,
        hasShippingAddress: !!firstOrder.shipping_address,
        hasProfile: !!firstOrder.profiles
      });
      
      // Test getOrderById with the first order
      console.log('Fetching order by ID:', firstOrder.id);
      const orderDetail = await OrderService.getOrderById(firstOrder.id.toString());
      console.log('Order detail fetched:', {
        id: orderDetail?.id,
        orderNumber: orderDetail?.order_number,
        itemsCount: orderDetail?.order_items?.length,
        hasShippingAddress: !!orderDetail?.shipping_address
      });
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testOrderFetching();