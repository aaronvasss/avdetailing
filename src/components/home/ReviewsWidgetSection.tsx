export function ReviewsWidgetSection() {
  return (
    <section className="section-padding bg-card">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            What Our <span className="text-primary">Customers Say</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real reviews from our Baton Rouge customers on Google.
          </p>
        </div>

        {/* Elfsight Google Reviews widget — paste widget code inside this container */}
        <div className="max-w-5xl mx-auto rounded-2xl border border-border bg-background/50 p-4 sm:p-6">
          <div
            className="elfsight-app-PLACEHOLDER"
            data-elfsight-app-lazy
            aria-label="Google Reviews"
          >
            {/* Replace this placeholder div's class with your Elfsight widget ID
                (e.g. elfsight-app-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) and add
                the Elfsight platform script to index.html. */}
          </div>
        </div>
      </div>
    </section>
  );
}
