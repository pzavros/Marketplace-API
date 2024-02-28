const { Sequelize, DataTypes } = require('sequelize');

// Establish a connection to the database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db/marketplace.db'
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
      len: [0, 50] // Ensures the name is up to 50 characters long
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
  }
}, {
  timestamps: false
});

// Create Cart table
const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
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


// Initialize the express application
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());


// Category Routes
app.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json(categories);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    res.status(200).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Create Category
app.post('/categories/create', async (req, res) => {
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
app.delete('/categories/delete/:id', async (req, res) => {
  const id = req.params.id;

  // Check if the ID is valid and a positive integer
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
    res.status(200).send('OK');
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
});
// End of Category Routes




// Product Routes
app.post('/product/create', async (req, res) => {
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

app.get('/product/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if id is a valid integer
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

app.delete('/product/delete/:id', async (req, res) => {
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

app.get('/products/list', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: Category
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error('Error details:', error);
    return res.status(500).json({ error: error.message || 'Error listing the products' });
  }
});

app.put('/product/update/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, categoryId } = req.body;

  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
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


    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error updating the product' });
  }
});
// End of Product Routes




// User Routes
// Create User
app.post('/user/create', async (req, res) => {
  const { username, accountBalance} = req.body;

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
    console.error('Error details:', error);
    return res.status(500).json({ error: error.message || 'Error creating the user' });
  }

});

// List Users
app.get('/user/list', async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error', error);
    res.status(422).json({ error: 'data items could not be retrieved. ' });
  }
});

// Get user by ID
app.get('/user/:id', async (req, res) => {
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
app.delete('/user/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isNaN(id) || id <= 0 || id === '') {
      return res.status(422).json({ error: 'Invalid ID' });
    }
    // const orders = await Order.findAll({
    //   where: {
    //     userId: id
    //   }
    // });
    // const carts = await Cart.findOne({
    //   where: {
    //     userId: id
    //   }
    // });

    // if (orders) {
    //   return res.status(422).json({
    //     error: 'User is referenced on Orders table'
    //   });
    // }
    // if (carts) {
    //   return res.status(422).json({
    //     error: 'User is referenced on Carts table'
    //   });
    // }

    const user = await User.destroy({
      where: {
        id
      }
    });
    if (user === 0) { // No user was deleted
      return res.status(404).send('User not found');
    }
    // Include logic here to also delete the user's cart if required
    return res.status(200).send('User Deleted successfully');
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error deleting the user' });
  }
});



// Cart Routes
// Get User's Cart
app.get('/api/user/getCart', async (req, res) => {
  const { userId } = req.query; // Assuming you're passing the userId as a query parameter

  if (isNaN(userId) || userId <= 0 || userId === '') {
    return res.status(422).json({ error: 'Invalid userID' });
  }

  if (!userId) {
    return res.status(422).json({ error: 'User does not exist' });
  }

  try {
    const cartItems = await CartItems.findAll({
      where: { userId },
      attributes: ['productId'], // Assuming you just want to return an array of productIds
    });

    const productIDs = cartItems.map(item => item.productId);

    res.status(200).json({
      userID: parseInt(userId),
      productIDs: productIDs
    });
  } catch (error) {
    res.status(422).json({ error: 'Could not retrieve cart items.' });
  }
});


// Add Product to Cart
app.post('/api/user/addToCart', async (req, res) => {
  const { userID, productID } = req.body;

  // Validate the provided IDs
  if (!userID || isNaN(userID) || !productID || isNaN(productID)) {
    return res.status(422).json({ error: 'Invalid userID or productID provided.' });
  }

  try {
    // Check if user and product exist
    const userExists = await User.findByPk(userID);
    const productExists = await Product.findByPk(productID);

    if (!userExists || !productExists) {
      return res.status(422).json({ error: 'User or Product does not exist.' });
    }

    // Check if product already exists in the user's cart
    const existingCartItem = await Cart.findOne({ where: { userId: userID, productId: productID } });

    if (existingCartItem) {
      return res.status(422).json({ error: 'Product already exists in the cart.' });
    }

    // Add product to the cart
    const newCartItem = await Cart.create({ userId: userID, productId: productID });

    // Fetch all items in the user's cart to return
    const cartItems = await Cart.findAll({
      where: { userId: userID },
      attributes: ['productId'], // Assuming you only want to return the product IDs
    });

    const productIDs = cartItems.map(item => item.productId);

    res.status(200).json({ productIDs });

  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ error: 'An error occurred while adding the product to the cart.' });
  }
});




// start API server
app.listen(port, () => {
  console.log(`server listening at port 3000`)
  console.log(`Press Ctrl+C to exit...`)
});
