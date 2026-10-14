import { GoogleReviews } from "@/components/reviews/GoogleReviews";

export function ReviewsWidgetSection() {
  return (
    <section className="section-padding bg-card">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            What Our <span className="text-primary">Customers Say</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real reviews from our Baton Rouge customers, straight from Google.
          </p>
        </div>
        <GoogleReviews />
      </div>
    </section>
  );
}
