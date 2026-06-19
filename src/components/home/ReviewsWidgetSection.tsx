export function ReviewsWidgetSection() {
  return (
    <section className="section-padding bg-card">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            What Our <span className="text-primary">Customers Say</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real reviews from our Baton Rouge customers.
          </p>
        </div>

        <div className="max-w-5xl mx-auto rounded-2xl border border-border bg-background/50 p-4 sm:p-6">
          <iframe
            className="lc_reviews_widget"
            src="https://reputationhub.site/reputation/widgets/review_widget/AwUQlQZwW3pFWZuiOm6A"
            frameBorder="0"
            scrolling="no"
            style={{ minWidth: "100%", width: "100%" }}
            title="Customer Reviews"
          />
        </div>
      </div>
    </section>
  );
}
