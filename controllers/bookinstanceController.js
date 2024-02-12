const BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();

  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allBookInstances,
  });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    // No results.
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: "Book:",
    bookinstance: bookInstance,
  });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

  res.render("bookinstance_form", {
    title: "Create Book Instance",
    book_list: allBooks,
  });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

      res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      // Data from form is valid
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  try {
    // Find the book instance by ID and populate the associated book
    const bookInstance = await BookInstance.findById(req.params.id).populate('book');

    if (!bookInstance) {
      // If the book instance is not found, return a 404 error
      const err = new Error('BookInstance not found');
      err.status = 404;
      throw err;
    }

    // Render the delete confirmation form
    res.render('bookinstance_delete', { title: 'Delete Book Instance', bookinstance: bookInstance });
  } catch (err) {
    // Pass any errors to the error handler middleware
    next(err);
  }
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  try {
    // Find the book instance by ID and delete it
    await BookInstance.findByIdAndDelete(req.body.bookinstanceid);

    // Redirect to the book instance list page
    res.redirect('/catalog/bookinstances');
  } catch (err) {
    // Pass any errors to the error handler middleware
    next(err);
  }
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  try {
    // Get the book instance to be updated
    const bookInstance = await BookInstance.findById(req.params.id).populate(
      "book"
    );

    if (bookInstance === null) {
      // No results.
      const err = new Error("Book instance not found");
      err.status = 404;
      return next(err);
    }

    // Fetch all books for the book list in the form
    const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

    res.render("bookinstance_form", {
      title: "Update Book Instance",
      bookinstance: bookInstance,
      book_list: allBooks,
      default_book_title: bookInstance.book.title, // Pass default book title to the view
    });
  } catch (err) {
    next(err);
  }
});

// Handle BookInstance update on POST.
exports.bookinstance_update_post = asyncHandler(async (req, res, next) => {
  try {
    // Create a BookInstance object with updated data
    const bookInstance = new BookInstance({
      _id: req.params.id, // Ensure this is the same ID as the existing book instance
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    // Validate the updated data
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors
      // Render the form again with sanitized values and error messages
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

      res.render("bookinstance_form", {
        title: "Update BookInstance",
        bookinstance: bookInstance,
        book_list: allBooks,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid
      // Update the record
      await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});

      // Redirect to book instance detail page
      res.redirect(bookInstance.url);
    }
  } catch (err) {
    next(err);
  }
});