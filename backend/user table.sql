CREATE TABLE IF NOT EXISTS users (
    userid INTEGER PRIMARY KEY,
    password TEXT NOT NULL,
    patient_id INTEGER,
    FOREIGN KEY(patient_id) REFERENCES patients(patient_id)
);


INSERT INTO users (userid, password, patient_id)
VALUES
("John", 'password123', 101),
("Jane", 'securepass', 102),
("Mike", 'strongpwd', 103),
("Emily", 'complexpass123', 104),
("David", 'longandsecurepassword', 105);
