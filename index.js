const express = require('express');
const path = require('path');
const ejsMate = require("ejs-mate");
const mOver = require('method-override');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2');
const session = require("express-session");
const bcrypt = require("bcrypt");
const app = express();
const port = 8080;

app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(mOver("_method"));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'dbms',
    password: '#codeRoshan'
});

app.use(session({
    secret: "12345",
    resave: false,
    saveUninitialized: true
}));

// to define "user" as global vatiable for all ejs files
app.use((req, res, next) => {
    res.locals.user = req.session.user || {};
    next();
});

// home route
app.get("/", async (req, res) => {
    res.render("listings/home.ejs");
});

// show all the listings
app.get("/listings", (req, res) => {
    let user = req.session.user;
    const sortMethod = req.query.sort || 'default';
    let orderBy;
    switch(sortMethod) {
        case 'alpha':
            orderBy = 'order by title ASC';
            break;
        case 'stLow':
            orderBy = 'order by price ASC';
            break;
        case 'stHigh':
            orderBy = 'order by price DESC';
            break;
        default:
            orderBy = '';
    }
    if(user && user.type === "managers"){
        let manager = user.email;
        let q = `SELECT * FROM listings WHERE manager_email = ? ${orderBy}`;
        connection.query(q, [manager, orderBy], (err, result) => {
            if (err) return res.send(err);
            res.render("listings/allListings.ejs", {result});
        });
    } else {
        let q = `SELECT * FROM listings ${orderBy}`;
        connection.query(q, (err, result) => {
            if (err) return res.send(err);
            res.render("listings/allListings.ejs", {result});
        });
    }
});

// to add a new listing
app.get("/listings/new", (req, res) => {
    if (!req.session.user || req.session.user.type !== "managers") {
        return res.status(403).send("<h2>Unauthorized: Manager login required</h2>");
    }
    res.render("listings/addNew.ejs");
});
app.post("/listings", (req, res) => {
    let id = uuidv4();
    let { title, description, image, price, location, country, manager_email } = req.body.listing;
    const { amenities } = req.body;
    let q = `INSERT INTO listings (id, title, description, image, price, location, country, manager_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    let values = [id, title, description, image, price, location, country, manager_email];
    connection.query(q, values, async (err, result) => {
        if (err) throw err;
        const processAmenities = async (amenityString, isPremium) => {
            if (!amenityString) return;
            
            const amenitiesList = amenityString.split(',')
                .map(a => a.trim())
                .filter(a => a.length > 0);

            for (const amenity of amenitiesList) {
                await connection.promise().query(
                    "INSERT INTO amenities (listing_id, amenity, premium) VALUES (?, ?, ?)",
                    [id, amenity, isPremium ? 1 : 0]
                );
            }
        };
        await Promise.all([
            processAmenities(amenities?.free, false),
            processAmenities(amenities?.premium, true)
        ]);
        res.redirect("/listings");
    });
});

// show a particular listings
app.get("/listings/:id", (req, res) => {
    let {id} = req.params;
    let searchQ = `
        SELECT listings.*,
        managers.name AS manager_name,
        managers.email AS manager_email,
        managers.phone AS manager_phone
        FROM listings
        JOIN managers ON listings.manager_email = managers.email
        WHERE listings.id = "${id}"`;
    let amenitiesQ = `SELECT amenity, premium FROM amenities where listing_id = "${id}"`;
    connection.query(searchQ, (err, result) => {
        if (err) throw err;
        let thisListing = result[0];
        connection.query(amenitiesQ, (err, amenities) => {
            if (err) throw err;
            let revQ = `SELECT reviews.*, users.name AS user_name
            FROM reviews JOIN users ON reviews.user_email = users.email 
            WHERE reviews.listing_id = "${id}"`;
            connection.query(revQ, (err, reviews) => {
                if(err) throw err;
                res.render("listings/showOne.ejs", { thisListing, amenities, reviews });
            });
        });
    });
});

// edit a listing
app.get("/listings/:id/edit", (req, res) => {
    if (!req.session.user || req.session.user.type !== "managers") {
        return res.status(403).send("<h2>Unauthorized: Manager login required</h2>");
    }
    let {id} = req.params;
    let searchQ = `SELECT * FROM listings WHERE id = "${id}"`;
    let amenitiesQ = `SELECT amenity, premium FROM amenities where listing_id = "${id}"`;
    connection.query(searchQ, (err, result) => {
        if (err) throw err;
        let thisListing = result[0];
        connection.query(amenitiesQ, (err, amenities) => {
            if (err) throw err;
            res.render("listings/edit.ejs", { thisListing, amenities });
        });
    });
});
app.patch("/listings/:id", async (req, res) => {
    const { id } = req.params;
    const { title, description, image, price, location, country } = req.body.listing;
    const { amenities } = req.body;

    try {
        const updateQuery = `
            UPDATE listings 
            SET title = ?, description = ?, image = ?, price = ?, location = ?, country = ?
            WHERE id = ?
        `;
        await connection.promise().query(updateQuery, 
            [title, description, image, price, location, country, id]);
        await connection.promise().query(
            "DELETE FROM amenities WHERE listing_id = ?", 
            [id]
        );
        const processAmenities = async (amenityString, isPremium) => {
            if (!amenityString) return;
            
            const amenitiesList = amenityString.split(',')
                .map(a => a.trim())
                .filter(a => a.length > 0);

            for (const amenity of amenitiesList) {
                await connection.promise().query(
                    "INSERT INTO amenities (listing_id, amenity, premium) VALUES (?, ?, ?)",
                    [id, amenity, isPremium ? 1 : 0]
                );
            }
        };
        await Promise.all([
            processAmenities(amenities?.free, false),
            processAmenities(amenities?.premium, true)
        ]);

        res.redirect(`/listings/${id}`);
    } catch (err) {
        console.error("Update failed:", err);
        res.status(500).send("Error updating listing");
    }
});

// delete a listing
app.delete("/listings/:id", (req, res) => {
    if (!req.session.user || req.session.user.type !== 'managers') {
        return res.status(403).send("<h2>Unauthorized: Manager login required</h2>");
    }
    let {id} = req.params;
    let q = `DELETE FROM listings WHERE id = "${id}"`;
    connection.query(q, (err, result) => {
        if (err) return res.send(err);
        res.redirect(`/listings`);
    });
});

// login
app.get("/login", (req, res) => {
    if (req.session.user) {
        return res.redirect("/dashboard");
    }
    res.render("utils/login.ejs", { wrongEmail: false, wrongPswd: false });
});
app.post("/login", async (req, res) => {
    const { email, password, userType } = req.body;
    const q = `SELECT * FROM ${userType} WHERE email = ?`;
    connection.query(q, [email], async (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.render("utils/login.ejs", { wrongEmail: true, wrongPswd: false });
        }
        const user = results[0];
        let match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = { email: user.email, name: user.name, type: userType };
            res.redirect("/dashboard");
        } else {
            res.render("utils/login.ejs", { wrongEmail: false, wrongPswd: true, email: email });
        }
    });
});

//signup
app.get("/signup", (req, res) => {
    if (req.session.user) {
        return res.redirect("/dashboard");
    }
    res.render("utils/signup.ejs", { wrongEmail: false });
});
app.post("/signup", async (req, res) => {
    let { email, name, password, phone, userType } = req.body;
    let checkQuery = `SELECT * FROM ${userType} WHERE email = ?`;
    connection.query(checkQuery, [email], async (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
        return res.render("utils/signup.ejs", { wrongEmail: true });
        }
        let hashedPswd = await bcrypt.hash(password ,5);
        if (userType === "users") {
            let insertUserQuery = "INSERT INTO users (email, name, password) VALUES (?, ?, ?)";
            connection.query(insertUserQuery, [email, name, hashedPswd], (err) => {
                if (err) throw err;
                req.session.user = { email: email, name: name, type: "users" };
                res.redirect("/dashboard");
            });
        } else if (userType === "managers") {
            let insertManagerQuery = "INSERT INTO managers (email, name, password, phone) VALUES (?, ?, ?, ?)";
            connection.query(insertManagerQuery, [email, name, hashedPswd, phone], (err) => {
                if (err) throw err;
                req.session.user = { email: email, name: name, type: "managers" };
                res.redirect("/dashboard");
            });
        }
    });
});

// dashboard
app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    let userEmail = req.session.user.email;
    let userType = req.session.user.type;
    if(userType === "users"){
        let q = `SELECT b.booking_id, b.listing_id, b.num_persons, 
                b.from_date, b.to_date,
                l.title, l.image, l.price
         FROM bookings b 
         JOIN listings l ON b.listing_id = l.id
         WHERE b.user_email = ?`;

connection.query(q, [userEmail], (err, results) => {
    if (err) throw err;
    let bookings = results.map(booking => {
        const fromDate = new Date(booking.from_date);
        const toDate = new Date(booking.to_date);
        const timeDiff = toDate.getTime() - fromDate.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
        return {
            ...booking,
            days: dayDiff,
            total_price: booking.price * dayDiff,
            from_date: booking.from_date.toISOString().slice(0, 10),
            to_date: booking.to_date.toISOString().slice(0, 10)
        };
    });
    res.render("utils/userDash.ejs", { bookings });
    });

    } else {
        const q = `SELECT 
            listings.title AS listing_title,
            users.name AS user_name,
            users.email AS user_email,
            bookings.from_date,
            bookings.to_date,
            bookings.num_persons
            FROM bookings
            JOIN listings ON bookings.listing_id = listings.id
            JOIN users ON bookings.user_email = users.email
            WHERE listings.manager_email = ?;
        `;
        connection.query(q, [req.session.user.email], (err, results) => {
        if (err) throw err;
        let bookings = results.map(booking => {
    return {
        ...booking,
        from_date: booking.from_date.toISOString().slice(0, 10),
        to_date: booking.to_date.toISOString().slice(0, 10)
    };
});
        res.render("utils/managerDash.ejs", { bookings });
        });
    }
});
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/listings");
});

// bookings
app.get("/booking", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    let { listingId, destination, price } = req.query;
    res.render("utils/booking.ejs", { listingId, destination, price });
});
app.post("/booking", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    const { listingId, no_of_persons, from_date, to_date } = req.body;
    const booking_id = uuidv4();
    const user_email = req.session.user.email;
    const insertQuery = `INSERT INTO bookings (booking_id, user_email, listing_id, num_persons, from_date, to_date) VALUES (?, ?, ?, ?, ?, ?)`;
    connection.query(insertQuery, [booking_id, user_email, listingId, no_of_persons, from_date, to_date], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Booking failed.");
            }
            res.redirect("/dashboard");
        }
    );
});
app.delete("/delBooking/:booking_id", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    const bookingId = req.params.booking_id;
    const userEmail = req.session.user.email;
    const verifyQuery = `SELECT * FROM bookings WHERE booking_id = ? AND user_email = ?`;
    connection.query(verifyQuery, [bookingId, userEmail], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Server error");
        }
        if (results.length === 0) {
            return res.status(404).send("Booking not found or not authorized");
        }
        const deleteQuery = `DELETE FROM bookings WHERE booking_id = ?`;
        connection.query(deleteQuery, [bookingId], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error deleting booking");
            }
            res.redirect("/dashboard");
        });
    });
});

// reviews paths
app.post("/review", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    let id = uuidv4();
    let {listingId, rating, comment} = req.body;
    let userEmail = req.session.user.email;
    let q = "INSERT INTO reviews VALUES (?, ?, ?, ?, ?)";
    connection.query(q, [id, userEmail, listingId, rating, comment], (err, result) => {
        if(err) throw err;
        res.redirect(`/listings/${listingId}`);
    });
});
app.delete("/reviews/:id", (req, res) => {
    let {id} = req.params;
    let { listingId } = req.body;
    let delQ = `DELETE FROM reviews WHERE review_id = "${id}"`;
    connection.query(delQ, (err, results) => {
        if(err) throw err;
        res.redirect(`/listings/${listingId}`);
    });
});

//fun
app.get("/privacy", (req, res) => {
    res.send("<h2>Privacy? In this era of Internet? Nah, we sold your data to advertisers.</h2>");
});
app.get("/terms", (req, res) => {
    res.send("<h2>We keep changing our temrs</h2>");
});
app.use(/.*/, (req, res) => {
    res.status(404).send("<h1>Error 404 | Page not found</h1>");
});

app.listen(port, () => {
    console.log(`Listing on port ${port}`);
    console.log(`http://localhost:${port}`);
});
