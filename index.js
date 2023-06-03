const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config()
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const userModel = require('./Models/userModel')
const productModel = require('./Models/productModel')

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '10mb' }));

// Middleware kiểm tra tên miền
const allowOnlyFromDomain = (allowedDomain) => {
    return (req, res, next) => {
        const clientDomain = req.headers.referer;
        if (clientDomain !== allowedDomain) {
            res.status(403).send('Forbidden'); // Trả về lỗi 403 nếu tên miền không được phép
        } else {
            next(); // Cho phép tiếp tục xử lý
        }
    };
};


// Middleware kiểm tra tên miền
app.use(allowOnlyFromDomain(process.env.URL_REACT));

//Connect database
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('Connect database is sucessfully!'))
    .catch((err) => console.log(err))


// USER MODEL ......................................................

// Phần đăng kí
app.post('/signup', (req, res) => {
    const { email } = req.body.data
    const { confirmPassword, ...data } = req.body.data
    userModel.findOne({ email: email })
        .then(result => {
            if (result) {
                res.send({ message: 'Email is already register' })
            }
            else {
                const newUser = new userModel(data)
                newUser.save()
                    .then(() => res.send({ message: 'success' }))
                    .catch()
            }
        })
        .catch()
})

// Hàm middleware authenticateToken
function authenticateToken(req, res, next) {
    // Lấy token từ header Authorization
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token không được cung cấp.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        // Lưu thông tin người dùng được giải mã từ token vào req.user
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Lỗi xác thực token:', err);
        return res.status(403).json({ error: 'Token không hợp lệ.' });
    }
}

// Sử dụng middleware authenticateToken để lấy thông tin
app.get('/user-info', authenticateToken, (req, res) => {
    res.json({ info: req.user });
});



// Phần đăng nhập
app.post('/login', (req, res) => {
    const { email, password } = req.body.data
    userModel.findOne({ email: email, password: password })
        .then(result => {
            if (result) {
                const token = jwt.sign({ name: result.name, email }, process.env.SECRET_KEY);
                res.send({ token })
            }
            else {
                res.send({ message: 'Email or password is invalid' })
            }
        })
        .catch()
})

// PRODUCT MODEL.......................................................

// Phần upload product
app.post("/uploadProduct", (req, res) => {
    const newProduct = new productModel(req.body.data)
    newProduct.save()
        .then(() => res.send({ message: "Upload successfully" }))
        .catch()
})

// Phần lấy sản phẩm
app.get('/products', (req, res) => {
    productModel.find({})
        .then(products => {
            res.send(products)
        })
        .catch()

})

// Phần xóa sản phẩm
app.put("/removeProduct", (req, res) => {
    productModel.deleteOne({ _id: req.body.data.id })
        .then(() => {
            cartModel.deleteMany({ idProduct: req.body.id })
                .then(() => {
                    res.send({ message: "Remove product successfully" })
                })
                .catch()
        })
        .catch()
})


app.get('/', (req, res) => {
    res.send('Hello world!')
})

// Khởi động server
app.listen(8080, () => {
    console.log('Server đang chạy trên cổng 8080');
});
