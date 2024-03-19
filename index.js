const { Sequelize, DataTypes } = require('sequelize');

// Establish a connection to the database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db/marketplace.db',
  logging: console.log,
});




// Define Models
// Create Category table
const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [0, 50]
    }
  }
}, {
  tableName: 'categories',
  timestamps: false
});

// Create Product table
const Product = sequelize.define('Product', {
  name: DataTypes.STRING,
  description: {
    type: DataTypes.STRING,
    defaultValue: "No product description"
  },
  price: DataTypes.DECIMAL(10, 2),
  stock: DataTypes.INTEGER,
  categoryId: DataTypes.INTEGER
}, {
  timestamps: false
});

// Create User table
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  accountBalance: {
    type: DataTypes.NUMBER,
    allowNull: false,
    defaultValue: 0
  },
}, {
  timestamps: false
});

// Define Cart model
const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  timestamps: false
});


const CartProduct = sequelize.define('CartProduct', {
  cartId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Cart',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Product',
      key: 'id'
    }
  }
}, {
  timestamps: false
});


// define Order model
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  createdOn: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false 
});

// define OrderProduct model
const OrderProduct = sequelize.define('OrderProduct', {
  orderId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Products',
      key: 'id'
    }
  }
}, {
  timestamps: false
});


// associations 
Order.belongsToMany(Product, { through: OrderProduct, foreignKey: 'orderId' });
Product.belongsToMany(Order, { through: OrderProduct, foreignKey: 'productId' });

Cart.belongsToMany(Product, { through: CartProduct, foreignKey: 'cartId' });
Product.belongsToMany(Cart, { through: CartProduct, foreignKey: 'productId' });



// Initialize the express application
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());


// ------------All routes-----------------


// -----------Category Routes----------------
// create category
app.post('/api/categories/create', async (req, res) => {
  const { name } = req.body;
  if (!name || name.length > 50) {
    return res.status(422).json({ error: 'Invalid category name.' });
  }
  try {
    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(409).json({ error: 'Category already exists.' });
    }
    const category = await Category.create({ name });
    res.status(200).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Category
app.delete('/api/categories/delete/:id', async (req, res) => {
  const id = req.params.id;

  // Check if the ID is valid
  if (!id || isNaN(id) || parseInt(id) < 1) {
    return res.status(422).json({ error: 'Invalid ID provided.' });
  }

  try {
    // Check if the category exists
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    // Delete the category
    await Category.destroy({
      where: { id }
    });
    res.status(200).send('Category deleted!');
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
});
// ---------------------End of Category Routes-----------------------




// ---------------------Product Routes-----------------------------
// Create Product
app.post('/api/product/create', async (req, res) => {
  const { name, description = "No product description", price, stock, categoryId } = req.body;

  if (!name || !price || !stock || !categoryId) {
    return res.status(422).json({ error: 'Invalid or missing parameters' });
  }

  try {
    const categoryExists = await Category.findByPk(categoryId);
    if (!categoryExists) {
      return res.status(422).json({ error: 'Category does not exist' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      categoryId
    });

    return res.status(200).json(product);
  } catch (error) {
    console.error('Error details:', error);
    return res.status(500).json({ error: error.message || 'Error creating the product' });
  }

});

// List products
app.get('/api/products/list', async (req, res) => {
  try {
    if (req.query.categoryId) {
      const categoryId = parseInt(req.query.categoryId);
      if (isNaN(categoryId) || categoryId <= 0) {
        return res.status(422).json({ error: 'Invalid category ID' });
      }

      const products = await Product.findAll({
        where: {
          categoryId
        }
      });

      return res.status(200).json(products);
    }



    const products = await Product.findAll();

    return res.status(200).json(products);
  } catch (error) {
    console.error('Error details:', error);
    return res.status(500).json({ error: error.message || 'Error listing the products' });
  }
});

// Get Product by id
app.get('/api/product/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if id is a valid
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(422).json({ error: 'Invalid ID' });
    }

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error getting the product' });
  }
});

// Delete Product
app.delete('/api/product/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error details:', error);
    return res.status(500).json({ error: error.message || 'Error deleting the product' });
  }

});

// Update product
app.put('/api/product/update/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, categoryId } = req.body;

  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if(id <= 0 || isNaN(id)) {
      return res.status(422).json({ error: 'Invalid ID' });
    }

    if (name) {
      product.name = name;
    }
    if (description) {
      product.description = description;
    }
    if (price) {
      product.price = price;
    }
    if (stock) {
      product.stock = stock;
    }
    if (categoryId) {
      product.categoryId = categoryId;
    }
    
    // Save the updates to the database
    await product.save();

   
    return res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    return res.status(500).json({ 
      error: error.message || 'Error updating the product' 
    });
  }
});
// -------------------End of Product Routes-----------------------




// --------------------------User Routes-----------------------
// Create User
app.post('/api/user/create', async (req, res) => {
  const { username, accountBalance } = req.body;

  if (!username) {
    return res.status(422).json({ error: 'Invalid or missing parameters' });
  }

  try {
    const user = await User.create({
      username,
      accountBalance
    });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error creating the user' });
  }

});

app.get('/api/user/getCart', async (req, res) => {
  const userId = parseInt(req.query.userId);
  if (!userId) {
    return res.status(422).json({ error: 'User ID is required.' });
  }

  try {
    // Find or create a cart for the user
    const [cart, created] = await Cart.findOrCreate({
      where: { userId },
      include: [{
        model: Product,
        as: 'Products',
      }],
    });

    const productIDs = cart.Products.map(product => product.id);

    return res.status(200).json({
      cartID: cart.id,
      userID: cart.userId,
      productIDs
    });


  } catch (error) {
    return res.status(422).json({ error: 'Failed to retrieve cart items.' });
  }
});

// List Users
app.get('/api/user/list', async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(422).json({ error: 'Failed to retreive data' });
  }
});

// Get user by ID
app.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isNaN(id) || id <= 0 || id === '') {
      return res.status(422).json({ error: 'Invalid ID' });
    }
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error getting the user' });
  }
});

// Delete User
app.delete('/api/user/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isNaN(id) || id <= 0 || id === '') {
      return res.status(422).json({ error: 'Invalid ID' });
    }
    const orders = await Order.findAll({
      where: {
        userId: id
      }
    });
    const carts = await Cart.findOne({
      where: {
        userId: id
      }
    });

    const users = await User.findByPk(id);

    if(users){
      if (orders && users.orderId) {
      return res.status(422).json({
        error: 'User is referenced on Orders table'
      });
    }
    }
    else{
      return res.status(404).send('User not found');
    }
    
    if (carts) {
      return res.status(422).json({
        error: 'User is referenced on Carts table'
      });
    }

    const user = await User.destroy({
      where: {
        id
      }
    });

    return res.status(200).send('User Deleted successfully');
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error deleting the user' });
  }
});

// Add to cart
app.post('/api/user/addToCart', async (req, res) => {
  const { userID, productID } = req.body;

  try {
    // User does not exists
    const user = await User.findByPk(userID);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Product does not exists
    const product = await Product.findByPk(productID);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Find or create a cart for the user
    let cart = await Cart.findOne({ where: { userId: userID } });
    if (!cart) {
      cart = await Cart.create({ userId: userID });
    }

    // product is already added in the cart
    const existingCartItem = await CartProduct.findOne({ where: { cartId: cart.id, productId: productID } });
    if (existingCartItem) {
      return res.status(422).json({ error: 'Product already in cart' });
    }

    
    await CartProduct.create({ cartId: cart.id, productId: productID });

    return res.status(200).json({ message: 'Product added to cart successfully' });

  } catch (error) {
    console.error('Error details:', error);
    return res.status(500).json({ error: error.message || 'Error adding product to cart' });
  }
});

// Remove from cart
app.delete('/api/user/removeFromCart', async (req, res) => {
  const { userID, productID } = req.body;

  // Validate request body
  if (!userID || !productID) {
    return res.status(422).json({ error: 'User ID and Product ID are required.' });
  }

  try {
    // userr does not exists
    const userExists = await User.findByPk(userID);
    if (!userExists) {
      return res.status(422).json({ 
        error: 'User does not exist.' 
      });
    }

    // product does not exists
    const productExists = await Product.findByPk(productID);
    if (!productExists) {
      return res.status(422).json({ 
        error: 'Product does not exist.' 
      });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ 
      where: { userId: userID } 
    });
    if (!cart) {
      return res.status(404).json({ 
        error: 'Cart not found for the user.' 
      });
    }

    // remove product
    const removedItem = await CartProduct.destroy({
      where: {
        cartId: cart.id,
        productId: productID
      }
    });



    // Return the updated cart
    return res.status(200).json({ removedItem });
  } catch (error) {
    return res.status(422).json({ 
      error: 'Failed to remove product from cart.',
    });
  }
  
});

// Purchase
app.post('/api/user/purchase', async (req, res) => {
  const { userID } = req.body;

  
  if (!userID) {
    return res.status(422).json({ error: 'User ID is required.' });
  }

  try {
    
    const user = await User.findByPk(userID);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get user's cart
    const cart = await Cart.findOne({
      where: { userId: userID },
      include: [{ model: Product}]
    });

    if (!cart) {
      return res.status(422).json({ error: 'The cart is empty.' });
    }

    // calculate total price
    let totalPrice = 0;
    let price = cart.Products.map(p => p.price);
    for (let i = 0; i < price.length; i++) {
      totalPrice += price[i];
    }

    if (user.accountBalance < totalPrice) {
      return res.status(422).json({ error: 'Insufficient account balance.' });
    }

    // Remove the price of the user's balance
    await User.update({ 
      accountBalance: user.accountBalance - totalPrice 
    }, { 
      where: { id: userID } 
    });

    // Create a new Order and OrderProduct entries
    const order = await Order.create({ 
      userId: userID, 
      createdOn: Math.floor(Date.now() / 1000) 
    });
   
    for (let i=0; i < cart.Products; i++) {
      await OrderProduct.create({ 
        orderId: order.id, 
        productId: product.id 
      });
    }


    return res.status(200).json({ message: 'Purchase successful', productIDs: cart.Products.map(p => p.id) });
  } catch (error) {
    console.error('Purchase Error:', error);
    return res.status(422).json({ error: 'Failed to complete purchase.' });
  }
});

// List Orders
app.get('/api/order/list', async (req, res) => {
  try {
    const { userID, productID } = req.query;

    let options = {
      include: [{
        model: Product,
      }]
    };

    if (productID) {
      options.include[0].where.id = productID;
    }

    if (userID) {
      options.where.userId = userID;
    }

    const orders = await Order.findAll(options);

    const response = orders.map(order => ({
      id: order.id,
      userID: order.userId,
      createdOn: order.createdOn,
      products: order.Products.map(product => product.id)
    }));

    return res.status(200).json({ orders: response });
  } catch (error) {
    console.error('List Orders Error:', error);
    return res.status(422).json({ error: 'Failed to list orders.' });
  }
});
// ---------------End of user routes--------------------





// start API server
sequelize.sync({ force: false }).then(() => {
  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
  });
}).catch(error => {
  console.error('Unable to sync database:', error);
});

