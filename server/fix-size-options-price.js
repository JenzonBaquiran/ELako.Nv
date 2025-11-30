const mongoose = require('mongoose');
require('./models/product.model');

async function fixSizeOptionsPrices() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ElakoNv');
    console.log('Connected to MongoDB');

    const Product = mongoose.model('Product');
    
    // Find all products with size options that have price 0 or undefined
    const products = await Product.find({
      'sizeOptions.0': { $exists: true },
      $or: [
        { 'sizeOptions.price': 0 },
        { 'sizeOptions.price': { $exists: false } }
      ]
    });

    console.log(`Found ${products.length} products with size options needing price updates`);

    for (const product of products) {
      console.log(`\nUpdating product: ${product.productName}`);
      console.log('Current sizeOptions:', product.sizeOptions);

      // Update size options with default prices based on size
      const updatedSizeOptions = product.sizeOptions.map(sizeOption => {
        if (!sizeOption.price || sizeOption.price === 0) {
          // Set default price based on size (you can adjust these defaults)
          let defaultPrice = product.price || 50; // Use base product price or default to 50
          
          // Adjust price based on size for beverages
          if (product.category === 'beverages') {
            if (sizeOption.size <= 100) {
              defaultPrice = Math.round(defaultPrice * 0.8); // Smaller size = 80% of base price
            } else if (sizeOption.size <= 200) {
              defaultPrice = Math.round(defaultPrice * 1.2); // Medium size = 120% of base price
            } else {
              defaultPrice = Math.round(defaultPrice * 1.5); // Large size = 150% of base price
            }
          }

          console.log(`  ${sizeOption.size}${sizeOption.unit}: ${sizeOption.price || 0} -> ${defaultPrice}`);
          
          return {
            ...sizeOption,
            price: defaultPrice
          };
        }
        return sizeOption;
      });

      // Update the product
      await Product.findByIdAndUpdate(product._id, {
        sizeOptions: updatedSizeOptions
      });
    }

    console.log('\nPrice updates completed!');
  } catch (error) {
    console.error('Error updating size option prices:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixSizeOptionsPrices();