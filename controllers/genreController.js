const Genre = require("../models/genre");
const asyncHandler = require("express-async-handler");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({ genre_name: 1 }).exec();
  res.render("genre_list", {
    title: "Genre List",
    genre_list: allGenres,
  });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  if (genre === null) {
    // No results.
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }

  res.render("genre_detail", {
    title: "Genre Detail",
    genre: genre,
    genre_books: booksInGenre,
  });
});

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      const genreExists = await Genre.findOne({ name: req.body.name }).exec();
      if (genreExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        // New genre saved. Redirect to genre detail page.
        res.redirect(genre.url);
      }
    }
  }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  try {
    // Get details of the genre and all associated books (in parallel)
    const [genre, booksUsingGenre] = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({ genre: req.params.id }, "title").exec(),
    ]);

    if (!genre) {
      // Genre not found.
      res.redirect("/catalog/genres");
      return;
    }

    res.render("genre_delete", {
      title: "Delete Genre",
      genre: genre,
      books_using_genre: booksUsingGenre,
    });
  } catch (err) {
    next(err);
  }
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  try {
    // Get details of the genre and all associated books (in parallel)
    const [genre, booksUsingGenre] = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({ genre: req.params.id }).exec(),
    ]);

    if (booksUsingGenre.length > 0) {
      // Genre has associated books. Render delete form with associated books.
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: genre,
        books_using_genre: booksUsingGenre,
      });
      return;
    } else {
      // Genre has no associated books. Delete the genre.
      await Genre.findByIdAndDelete(req.body.genreid);
      res.redirect("/catalog/genres");
    }
  } catch (err) {
    next(err);
  }
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  try {
    // Get the genre to be updated
    const genre = await Genre.findById(req.params.id);

    if (genre === null) {
      // No results.
      const err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    }

    res.render("genre_form", {
      title: "Update Genre",
      genre: genre,
    });
  } catch (err) {
    next(err);
  }
});

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and sanitize fields.
  body("name", "Genre name must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id, // This is required to specify the genre to update
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Update Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      try {
        // Data from form is valid. Update the record.
        await Genre.findByIdAndUpdate(req.params.id, genre, {});

        // Redirect to genre detail page.
        res.redirect(genre.url);
      } catch (err) {
        next(err);
      }
    }
  }),
];
