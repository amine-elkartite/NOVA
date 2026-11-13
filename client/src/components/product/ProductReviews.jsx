import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";

import reviewService from "../../services/reviewService";

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
  });

  const [myReview, setMyReview] = useState(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [checkingMyReview, setCheckingMyReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      if (!productId) {
        setReviews([]);
        setStats({
          totalReviews: 0,
          averageRating: 0,
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data =
          await reviewService.getProductReviews(productId);

        if (!active) return;

        setReviews(
          Array.isArray(data?.reviews)
            ? data.reviews
            : [],
        );

        setStats({
          totalReviews:
            Number(data?.stats?.totalReviews) || 0,
          averageRating:
            Number(data?.stats?.averageRating) || 0,
        });
      } catch (err) {
        if (!active) return;

        setError(
          err?.message ||
            "Impossible de charger les avis.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    let active = true;

    async function loadMyReview() {
      if (!productId) {
        setMyReview(null);
        return;
      }

      const token = localStorage.getItem("nova_token");

      if (!token) {
        setMyReview(null);
        return;
      }

      try {
        setCheckingMyReview(true);

        const data =
          await reviewService.getMyProductReview(productId);

        if (!active) return;

        setMyReview(data?.review || null);
      } catch (err) {
        if (!active) return;

        if (err?.status === 401) {
          setMyReview(null);
          return;
        }

        console.error(
          "Impossible de charger votre avis :",
          err,
        );
      } finally {
        if (active) {
          setCheckingMyReview(false);
        }
      }
    }

    loadMyReview();

    return () => {
      active = false;
    };
  }, [productId]);

  const averageStars = useMemo(() => {
    const rounded = Math.round(stats.averageRating);

    return Math.max(
      0,
      Math.min(5, rounded),
    );
  }, [stats.averageRating]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!productId) return;

    const token = localStorage.getItem("nova_token");

    if (!token) {
      setSubmitMessage(
        "Connectez-vous pour laisser un avis.",
      );
      return;
    }

    if (myReview) {
      setSubmitMessage(
        "Vous avez déjà laissé un avis sur ce produit.",
      );
      return;
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      setSubmitMessage(
        "Choisissez une note entre 1 et 5.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setSubmitMessage("");

      const data = await reviewService.createReview({
        productId,
        rating,
        comment,
      });

      setMyReview(data?.review || null);
      setComment("");
      setRating(5);

      setSubmitMessage(
        data?.message ||
          "Votre avis a été envoyé et attend la validation.",
      );
    } catch (err) {
      setSubmitMessage(
        err?.message ||
          "Impossible d'envoyer votre avis.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="product-reviews-section">
      <div className="product-section-heading">
        <div>
          <span>Avis clients</span>

          <h2>Ce que pensent nos clients</h2>

          {!loading && stats.totalReviews > 0 && (
            <div className="reviews-summary">
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    fill={
                      star <= averageStars
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>

              <span>
                {stats.averageRating.toFixed(1)} / 5
              </span>
            </div>
          )}
        </div>

        <span className="reviews-count">
          {stats.totalReviews}{" "}
          {stats.totalReviews > 1
            ? "avis"
            : "avis"}
        </span>
      </div>

      {loading && (
        <p className="reviews-status">
          Chargement des avis...
        </p>
      )}

      {!loading && error && (
        <p className="reviews-status reviews-error">
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        reviews.length === 0 && (
          <p className="reviews-status">
            Aucun avis publié pour le moment.
          </p>
        )}

      {!loading &&
        !error &&
        reviews.length > 0 && (
          <div className="reviews-grid">
            {reviews.map((review) => {
              const customerName =
                `${review.first_name || ""} ${
                  review.last_name || ""
                }`.trim() || "Client NOVA";

              return (
                <article
                  key={review.id}
                  className="review-card"
                >
                  <div className="review-card-top">
                    <div>
                      <strong>
                        {customerName}
                      </strong>

                      <span>
                        {formatDate(
                          review.created_at,
                        )}
                      </span>
                    </div>

                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map(
                        (star) => (
                          <Star
                            key={star}
                            size={14}
                            fill={
                              star <=
                              Number(
                                review.rating,
                              )
                                ? "currentColor"
                                : "none"
                            }
                          />
                        ),
                      )}
                    </div>
                  </div>

                  {review.comment && (
                    <p>{review.comment}</p>
                  )}
                </article>
              );
            })}
          </div>
        )}

      <div className="product-review-form-wrap">
        <div className="product-section-heading">
          <div>
            <span>Votre expérience</span>
            <h2>Laisser un avis</h2>
          </div>
        </div>

        {checkingMyReview ? (
          <p className="reviews-status">
            Vérification de votre avis...
          </p>
        ) : myReview ? (
          <div className="my-review-status">
            <strong>
              Votre avis a déjà été envoyé.
            </strong>

            <p>
              Statut :{" "}
              {myReview.status === "pending"
                ? "En attente de validation"
                : myReview.status ===
                    "approved"
                  ? "Publié"
                  : "Refusé"}
            </p>
          </div>
        ) : (
          <form
            className="product-review-form"
            onSubmit={handleSubmit}
          >
            <div className="review-form-group">
              <label>Votre note</label>

              <div className="review-rating-selector">
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <button
                      key={star}
                      type="button"
                      className={
                        star <= rating
                          ? "review-star-button active"
                          : "review-star-button"
                      }
                      onClick={() =>
                        setRating(star)
                      }
                      aria-label={`${star} étoile${
                        star > 1 ? "s" : ""
                      }`}
                    >
                      <Star
                        size={22}
                        fill={
                          star <= rating
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="review-form-group">
              <label htmlFor="review-comment">
                Votre commentaire
              </label>

              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) =>
                  setComment(
                    event.target.value,
                  )
                }
                placeholder="Partagez votre expérience avec ce produit..."
                rows={5}
                maxLength={1000}
              />
            </div>

            <button
              type="submit"
              className="review-submit-button"
              disabled={submitting}
            >
              {submitting
                ? "Envoi..."
                : "Envoyer mon avis"}
            </button>

            {submitMessage && (
              <p className="review-submit-message">
                {submitMessage}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}

export default ProductReviews;