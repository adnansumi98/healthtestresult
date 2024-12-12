CREATE TABLE IF NOT EXISTS  patients (
    patient_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    accession_no TEXT UNIQUE,
    gender TEXT,
    age INTEGER,
    date_of_test DATE,
    total_cholestrol REAL,
    HDL_cholestrol REAL,
    VLDL REAL,
    LDL_cholestrol REAL,
    non_HDL_cholestrol REAL,
    Triglycerides REAL
);


INSERT INTO patients (petient_id, name, accession_no, gender, age, date_of_test, total_cholestrol, HDL_cholestrol, VLDL, LDL_cholestrol, non_HDL_cholestrol, Triglycerides)
VALUES
(101,'John Doe', 'ACC001', 'Male', 45, '2023-12-12', 200.5, 60.2, 15.6, 120.7, 140.8, 150.9),
(102,'Jane Smith', 'ACC002', 'Female', 38, '2023-12-13', 220.1, 65.4, 16.2, 125.5, 145.6, 160.7),
(103,'Mike Johnson', 'ACC003', 'Male', 52, '2023-12-14', 180.3, 55.6, 14.7, 110.0, 130.1, 140.2),
(104,'Emily Williams', 'ACC004', 'Female', 42, '2023-12-15', 210.8, 62.1, 17.4, 122.3, 138.4, 158.5),
(105,'David Brown', 'ACC005', 'Male', 48, '2023-12-16', 190.2, 58.9, 15.8, 115.5, 135.6, 145.7);
