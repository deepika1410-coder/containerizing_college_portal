-- CampusFlow Relational Database Schema (PostgreSQL Standard)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'FACULTY', 'ADMIN')),
    avatar_url TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    register_number VARCHAR(50) UNIQUE NOT NULL,
    department_id INT REFERENCES departments(id),
    year INT NOT NULL,
    semester INT NOT NULL,
    section VARCHAR(5) DEFAULT 'A',
    cgpa NUMERIC(4,2) DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS faculty (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department_id INT REFERENCES departments(id),
    designation VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    department_id INT REFERENCES departments(id),
    semester INT NOT NULL,
    credits INT NOT NULL DEFAULT 3,
    max_seats INT NOT NULL DEFAULT 60,
    enrolled_count INT NOT NULL DEFAULT 0,
    faculty_id INT REFERENCES faculty(id),
    deadline TIMESTAMP WITH TIME ZONE,
    syllabus TEXT
);

CREATE TABLE IF NOT EXISTS course_registrations (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    semester INT NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'DROPPED')),
    CONSTRAINT unique_student_course_sem UNIQUE(student_id, course_id, semester)
);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id INT REFERENCES faculty(id),
    date DATE NOT NULL,
    hour INT NOT NULL,
    topic VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    attendance_id INT REFERENCES attendance(id) ON DELETE CASCADE,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'ON_DUTY')),
    remarks TEXT,
    CONSTRAINT unique_attendance_student UNIQUE(attendance_id, student_id)
);

CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    semester INT NOT NULL,
    internal_marks NUMERIC(5,2) DEFAULT 0.0,
    external_marks NUMERIC(5,2) DEFAULT 0.0,
    total_marks NUMERIC(5,2) DEFAULT 0.0,
    grade VARCHAR(5),
    grade_point INT DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_course_result UNIQUE(student_id, course_id, semester)
);

CREATE TABLE IF NOT EXISTS timetable (
    id SERIAL PRIMARY KEY,
    department_id INT REFERENCES departments(id),
    semester INT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    course_id INT REFERENCES courses(id),
    faculty_id INT REFERENCES faculty(id),
    room VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INT REFERENCES users(id) ON DELETE CASCADE, -- NULL indicates global broadcast
    sender_id INT REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('EXAM', 'REGISTRATION', 'ATTENDANCE', 'RESULT', 'COLLEGE', 'ASSIGNMENT')),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for high-performance query execution during exam/registration periods
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_reg ON students(register_number);
CREATE INDEX IF NOT EXISTS idx_courses_dept_sem ON courses(department_id, semester);
CREATE INDEX IF NOT EXISTS idx_reg_student ON course_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_reg_course ON course_registrations(course_id);
CREATE INDEX IF NOT EXISTS idx_att_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
