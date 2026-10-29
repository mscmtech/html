
"use strict";

// ---------- STORAGE AND INITIAL DATA ----------

const STORAGE_KEY = "smartStudentLibrary_v1";

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);

            if (
                Array.isArray(data.books) &&
                Array.isArray(data.students) &&
                Array.isArray(data.transactions)
            ) {
                return data;
            }
        }
    } catch (error) {
        console.error("Could not load library data:", error);
    }

    return {
        books: [
            {
                id: "B001",
                title: "Java Programming",
                author: "Herbert Schildt",
                isbn: "9780000000011",
                category: "Programming",
                total: 5
            },
            {
                id: "B002",
                title: "Database Management Systems",
                author: "Raghu Ramakrishnan",
                isbn: "9780000000028",
                category: "Database",
                total: 4
            },
            {
                id: "B003",
                title: "Artificial Intelligence",
                author: "Stuart Russell",
                isbn: "9780000000035",
                category: "AI & ML",
                total: 3
            },
            {
                id: "B004",
                title: "Computer Networks",
                author: "Andrew Tanenbaum",
                isbn: "9780000000042",
                category: "Networking",
                total: 4
            }
        ],
        students: [
            {
                id: "S001",
                studentId: "STU001",
                name: "Ananya Sharma",
                email: "ananya@example.com",
                course: "B.Tech AIML",
                year: "2nd Year"
            },
            {
                id: "S002",
                studentId: "STU002",
                name: "Rahul Kumar",
                email: "rahul@example.com",
                course: "B.Tech CSE",
                year: "3rd Year"
            },
            {
                id: "S003",
                studentId: "STU003",
                name: "Priya Reddy",
                email: "priya@example.com",
                course: "B.Tech AIML",
                year: "1st Year"
            }
        ],
        transactions: []
    };
}

let library = loadData();
let toastTimer;

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
        return true;
    } catch (error) {
        console.error("Could not save library data:", error);
        notify("Unable to save data. Check browser storage.");
        return false;
    }
}

// ---------- GENERAL HELPERS ----------

function makeId(prefix) {
    return prefix + Date.now().toString(36) +
        Math.random().toString(36).slice(2, 6).toUpperCase();
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getBook(id) {
    return library.books.find(book => book.id === id);
}

function getStudent(id) {
    return library.students.find(student => student.id === id);
}

function getTransactionStatus(transaction) {
    if (transaction.status === "Returned") return "Returned";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(transaction.dueDate + "T00:00:00");

    return due < today ? "Overdue" : "Issued";
}

function formatDate(dateString) {
    if (!dateString) return "—";

    const date = new Date(dateString + "T00:00:00");

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function notify(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function openModal(id) {
    if (id === "issueModal") {
        populateIssueOptions();
    }

    document.getElementById(id).classList.add("show");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}

function showSection(sectionId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.toggle("active", page.id === sectionId);
    });

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.section === sectionId
        );
    });

    renderAll();
}

document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
        showSection(button.dataset.section);
    });
});

document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.classList.remove("show");
        }
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        document.querySelectorAll(".modal.show").forEach(modal => {
            modal.classList.remove("show");
        });
    }
});

// ---------- DASHBOARD ----------

function renderDashboard() {
    const totalCopies = library.books.reduce(
        (sum, book) => sum + book.total, 0
    );

    const issuedCount = library.transactions.filter(
        transaction => transaction.status === "Issued"
    ).length;

    const availableCount = totalCopies - issuedCount;

    document.getElementById("totalBooks").textContent = totalCopies;
    document.getElementById("availableBooks").textContent = availableCount;
    document.getElementById("issuedBooks").textContent = issuedCount;
    document.getElementById("totalStudents").textContent =
        library.students.length;

    const recent = [...library.transactions]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);

    const tbody = document.getElementById("recentTransactions");

    if (recent.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:25px">
                    No transactions yet. Issue a book to get started.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = recent.map(transaction => {
        const book = getBook(transaction.bookId);
        const student = getStudent(transaction.studentId);
        const status = getTransactionStatus(transaction);

        return `
            <tr>
                <td>
                    <span class="book-title">
                        ${escapeHTML(book?.title || "Deleted book")}
                    </span>
                </td>
                <td>${escapeHTML(student?.name || "Deleted student")}</td>
                <td>${formatDate(transaction.issueDate)}</td>
                <td>${formatDate(transaction.dueDate)}</td>
                <td>
                    <span class="status ${status.toLowerCase()}">
                        ${status}
                    </span>
                </td>
            </tr>`;
    }).join("");
}

// ---------- BOOK MANAGEMENT ----------

function renderBooks() {
    const search = document.getElementById("bookSearch")
        .value.trim().toLowerCase();

    const category = document.getElementById("categoryFilter").value;

    const books = library.books.filter(book => {
        const matchesSearch = [
            book.title, book.author, book.isbn, book.category
        ].some(value => String(value).toLowerCase().includes(search));

        return matchesSearch &&
            (!category || book.category === category);
    });

    document.getElementById("booksTable").innerHTML = books.map(book => {
        const activeIssues = library.transactions.filter(
            transaction =>
                transaction.bookId === book.id &&
                transaction.status === "Issued"
        ).length;

        const available = book.total - activeIssues;

        return `
            <tr>
                <td>
                    <span class="book-title">${escapeHTML(book.title)}</span>
                    <span class="subtext">ISBN: ${escapeHTML(book.isbn)}</span>
                </td>
                <td>${escapeHTML(book.author)}</td>
                <td>${escapeHTML(book.category)}</td>
                <td>${book.total}</td>
                <td>
                    <span class="status ${available > 0 ? "available" : "overdue"}">
                        ${available}
                    </span>
                </td>
                <td>
                    <button class="action-btn"
                        data-action="issue" data-id="${escapeHTML(book.id)}"
                        ${available < 1 ? "disabled" : ""}>
                        Issue
                    </button>
                    <button class="action-btn danger"
                        data-action="delete-book" data-id="${escapeHTML(book.id)}">
                        Delete
                    </button>
                </td>
            </tr>`;
    }).join("");

    document.getElementById("booksEmpty").hidden = books.length !== 0;
}

document.getElementById("bookSearch").addEventListener("input", renderBooks);
document.getElementById("categoryFilter").addEventListener("change", renderBooks);

document.getElementById("bookForm").addEventListener("submit", event => {
    event.preventDefault();

    const form = event.currentTarget;
    const values = new FormData(form);

    const title = values.get("title").trim();
    const author = values.get("author").trim();
    const isbn = values.get("isbn").trim();
    const category = values.get("category");
    const copies = Number(values.get("copies"));

    if (!title || !author || !isbn || !category ||
        !Number.isInteger(copies) || copies < 1) {
        notify("Please enter valid book details.");
        return;
    }

    if (library.books.some(
        book => book.isbn.toLowerCase() === isbn.toLowerCase()
    )) {
        notify("A book with this ISBN already exists.");
        return;
    }

    library.books.push({
        id: makeId("B"),
        title,
        author,
        isbn,
        category,
        total: copies
    });

    if (!saveData()) {
        library.books.pop();
        return;
    }

    form.reset();
    closeModal("bookModal");
    renderAll();
    notify("Book added successfully!");
});

// ---------- STUDENT MANAGEMENT ----------

function renderStudents() {
    const search = document.getElementById("studentSearch")
        .value.trim().toLowerCase();

    const students = library.students.filter(student => {
        return [
            student.studentId,
            student.name,
            student.email,
            student.course,
            student.year
        ].some(value => String(value).toLowerCase().includes(search));
    });

    document.getElementById("studentsTable").innerHTML =
        students.map(student => `
            <tr>
                <td><strong>${escapeHTML(student.studentId)}</strong></td>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(student.email)}</td>
                <td>${escapeHTML(student.course)}</td>
                <td>${escapeHTML(student.year)}</td>
                <td>
                    <button class="action-btn danger"
                        data-action="delete-student"
                        data-id="${escapeHTML(student.id)}">
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");

    document.getElementById("studentsEmpty").hidden =
        students.length !== 0;
}

document.getElementById("studentSearch")
    .addEventListener("input", renderStudents);

document.getElementById("studentForm").addEventListener("submit", event => {
    event.preventDefault();

    const form = event.currentTarget;
    const values = new FormData(form);

    const studentId = values.get("studentId").trim();
    const name = values.get("name").trim();
    const email = values.get("email").trim();
    const course = values.get("course").trim();
    const year = values.get("year");

    if (!studentId || !name || !email || !course || !year) {
        notify("Please complete all student details.");
        return;
    }

    if (library.students.some(
        student => student.studentId.toLowerCase() === studentId.toLowerCase()
    )) {
        notify("This student ID is already registered.");
        return;
    }

    if (library.students.some(
        student => student.email.toLowerCase() === email.toLowerCase()
    )) {
        notify("This email is already registered.");
        return;
    }

    library.students.push({
        id: makeId("S"),
        studentId,
        name,
        email,
        course,
        year
    });

    if (!saveData()) {
        library.students.pop();
        return;
    }

    form.reset();
    closeModal("studentModal");
    renderAll();
    notify("Student registered successfully!");
});

// ---------- ISSUE BOOK ----------

function populateIssueOptions() {
    const bookSelect = document.getElementById("issueBookSelect");
    const studentSelect = document.getElementById("issueStudentSelect");

    const selectedBook = bookSelect.value;
    const selectedStudent = studentSelect.value;

    bookSelect.innerHTML = '<option value="">Choose a book</option>';

    library.books.forEach(book => {
        const activeIssues = library.transactions.filter(
            transaction =>
                transaction.bookId === book.id &&
                transaction.status === "Issued"
        ).length;

        const available = book.total - activeIssues;

        if (available > 0) {
            const option = document.createElement("option");
            option.value = book.id;
            option.textContent =
                `${book.title} (${available} available)`;
            bookSelect.appendChild(option);
        }
    });

    studentSelect.innerHTML = '<option value="">Choose a student</option>';

    library.students.forEach(student => {
        const option = document.createElement("option");
        option.value = student.id;
        option.textContent =
            `${student.name} (${student.studentId})`;
        studentSelect.appendChild(option);
    });

    if ([...bookSelect.options].some(option => option.value === selectedBook)) {
        bookSelect.value = selectedBook;
    }

    if ([...studentSelect.options].some(
        option => option.value === selectedStudent
    )) {
        studentSelect.value = selectedStudent;
    }

    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 14);

    document.getElementById("issueDate").value = toDateInput(today);
    document.getElementById("dueDate").value = toDateInput(due);
}

function toDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

document.getElementById("issueForm").addEventListener("submit", event => {
    event.preventDefault();

    const form = event.currentTarget;
    const values = new FormData(form);

    const bookId = values.get("bookId");
    const studentId = values.get("studentId");
    const issueDate = values.get("issueDate");
    const dueDate = values.get("dueDate");

    const book = getBook(bookId);
    const student = getStudent(studentId);

    if (!book || !student || !issueDate || !dueDate) {
        notify("Please select a valid book and student.");
        return;
    }

    if (dueDate < issueDate) {
        notify("Due date cannot be earlier than issue date.");
        return;
    }

    const activeIssues = library.transactions.filter(
        transaction =>
            transaction.bookId === bookId &&
            transaction.status === "Issued"
    ).length;

    if (activeIssues >= book.total) {
        notify("No copies of this book are available.");
        populateIssueOptions();
        return;
    }

    // Prevent duplicate borrowing of the same book by the same student.
    const alreadyBorrowed = library.transactions.some(
        transaction =>
            transaction.bookId === bookId &&
            transaction.studentId === studentId &&
            transaction.status === "Issued"
    );

    if (alreadyBorrowed) {
        notify("This student has already borrowed this book.");
        return;
    }

    const transaction = {
        id: makeId("T"),
        bookId,
        studentId,
        issueDate,
        dueDate,
        status: "Issued",
        createdAt: Date.now()
    };

    library.transactions.push(transaction);

    if (!saveData()) {
        library.transactions.pop();
        return;
    }

    form.reset();
    closeModal("issueModal");
    renderAll();
    notify("Book issued successfully!");
});

// ---------- TRANSACTION HISTORY AND RETURN ----------

function renderTransactions() {
    const search = document.getElementById("transactionSearch")
        .value.trim().toLowerCase();

    const filter = document.getElementById("transactionFilter").value;

    const transactions = [...library.transactions]
        .sort((a, b) => b.createdAt - a.createdAt)
        .filter(transaction => {
            const book = getBook(transaction.bookId);
            const student = getStudent(transaction.studentId);
            const status = getTransactionStatus(transaction);

            const matchesSearch = [
                book?.title,
                book?.isbn,
                student?.name,
                student?.studentId
            ].some(value => String(value || "").toLowerCase().includes(search));

            return matchesSearch && (!filter || status === filter);
        });

    document.getElementById("transactionsTable").innerHTML =
        transactions.map(transaction => {
            const book = getBook(transaction.bookId);
            const student = getStudent(transaction.studentId);
            const status = getTransactionStatus(transaction);

            return `
                <tr>
                    <td>
                        <span class="book-title">
                            ${escapeHTML(book?.title || "Deleted book")}
                        </span>
                        <span class="subtext">
                            ${escapeHTML(book?.isbn || "")}
                        </span>
                    </td>
                    <td>
                        ${escapeHTML(student?.name || "Deleted student")}
                        <span class="subtext">
                            ${escapeHTML(student?.studentId || "")}
                        </span>
                    </td>
                    <td>${formatDate(transaction.issueDate)}</td>
                    <td>${formatDate(transaction.dueDate)}</td>
                    <td>
                        <span class="status ${status.toLowerCase()}">
                            ${status}
                        </span>
                    </td>
                    <td>
                        ${transaction.status === "Issued"
                            ? `<button class="action-btn"
                                data-action="return-book"
                                data-id="${escapeHTML(transaction.id)}">
                                Return Book
                               </button>`
                            : `<span class="subtext">
                                ${transaction.returnDate
                                    ? "Returned " + formatDate(transaction.returnDate)
                                    : "Completed"}
                               </span>`
                        }
                    </td>
                </tr>
            `;
        }).join("");

    document.getElementById("transactionsEmpty").hidden =
        transactions.length !== 0;
}

document.getElementById("transactionSearch")
    .addEventListener("input", renderTransactions);

document.getElementById("transactionFilter")
    .addEventListener("change", renderTransactions);

// Use delegated click handling for table action buttons.
document.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "issue") {
        openModal("issueModal");
        document.getElementById("issueBookSelect").value = id;
    }

    if (action === "return-book") {
        returnBook(id);
    }

    if (action === "delete-book") {
        deleteBook(id);
    }

    if (action === "delete-student") {
        deleteStudent(id);
    }
});

function returnBook(id) {
    const transaction = library.transactions.find(
        item => item.id === id
    );

    if (!transaction || transaction.status !== "Issued") {
        notify("This transaction is already completed.");
        return;
    }

    if (!confirm("Confirm that this book has been returned?")) {
        return;
    }

    transaction.status = "Returned";
    transaction.returnDate = toDateInput(new Date());

    if (!saveData()) {
        transaction.status = "Issued";
        delete transaction.returnDate;
        return;
    }

    renderAll();
    notify("Book returned successfully!");
}

// ---------- SAFE DELETION ----------

function deleteBook(id) {
    const book = getBook(id);

    if (!book) return;

    const hasActiveIssue = library.transactions.some(
        transaction =>
            transaction.bookId === id &&
            transaction.status === "Issued"
    );

    if (hasActiveIssue) {
        notify("Return all issued copies before deleting this book.");
        return;
    }

    if (!confirm(`Delete "${book.title}" from the library?`)) {
        return;
    }

    const oldBooks = library.books;
    library.books = library.books.filter(item => item.id !== id);

    if (!saveData()) {
        library.books = oldBooks;
        return;
    }

    renderAll();
    notify("Book deleted successfully.");
}

function deleteStudent(id) {
    const student = getStudent(id);

    if (!student) return;

    const hasActiveIssue = library.transactions.some(
        transaction =>
            transaction.studentId === id &&
            transaction.status === "Issued"
    );

    if (hasActiveIssue) {
        notify("This student must return all borrowed books first.");
        return;
    }

    if (!confirm(`Delete student "${student.name}"?`)) {
        return;
    }

    const oldStudents = library.students;
    library.students = library.students.filter(item => item.id !== id);

    if (!saveData()) {
        library.students = oldStudents;
        return;
    }

    renderAll();
    notify("Student deleted successfully.");
}

// ---------- RENDER ALL SECTIONS ----------

function renderAll() {
    renderDashboard();
    renderBooks();
    renderStudents();
    renderTransactions();
}

document.getElementById("today").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

renderAll();
