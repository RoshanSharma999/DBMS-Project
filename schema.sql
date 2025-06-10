CREATE TABLE listings(
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(1000) NOT NULL,
    image VARCHAR(3000) NOT NULL,
    price INT UNSIGNED NOT NULL,
    location VARCHAR(50) NOT NULL,
    country VARCHAR(30) NOT NULL,
    manager_email VARCHAR(50) NOT NULL,
    FOREIGN KEY (manager_email) REFERENCES managers(email)
);

CREATE TABLE users(
    email VARCHAR(30) PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    password VARCHAR(500) NOT NULL
);

CREATE TABLE bookings (
    booking_id VARCHAR(50) PRIMARY KEY,
    user_email VARCHAR(30),
    listing_id VARCHAR(50),
    num_persons INT UNSIGNED NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE managers (
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50) PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(500) NOT NULL
);

CREATE TABLE reviews(
    review_id VARCHAR(50) PRIMARY KEY,
    user_email VARCHAR(30),
    listing_id VARCHAR(50),
    rating INT,
    comment VARCHAR(500),
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE amenities (
    listing_id VARCHAR(50),
    amenity VARCHAR(100),
    premium BOOLEAN NOT NULL,
    PRIMARY KEY (listing_id, amenity),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);
