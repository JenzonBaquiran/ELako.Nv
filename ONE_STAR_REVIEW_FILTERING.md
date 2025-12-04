# One-Star Review Filtering Feature

## Overview

This feature implements a filtering system where 1-star reviews are hidden from customer-facing views but remain visible to store owners in their Reviews & Ratings dashboard.

## Business Logic

- **Customer View**: 1-star reviews are filtered out from all product displays and feedback sections
- **Store Owner View**: All reviews (including 1-star) remain visible in the Reviews & Ratings dashboard
- **Rating Calculations**: All ratings (including 1-star) are still included in average rating calculations

## Implementation Details

### Modified Endpoints

The following customer-facing endpoints now filter out 1-star reviews:

1. **`GET /api/products/:productId`** - Single product details
2. **`GET /api/products`** - All products listing
3. **`GET /api/products/:id`** - Alternative product details endpoint
4. **`GET /api/msme/:msmeId/products`** - Products by store/MSME

### Store Owner Endpoints (Unchanged)

These endpoints continue to show ALL reviews including 1-star:

1. **`GET /api/stores/:storeId/reviews`** - Store owner Reviews & Ratings dashboard

### Code Changes

Each customer-facing endpoint now includes this filter in the feedback processing:

```javascript
// Before: Show all reviews
productData.feedback = productData.feedback.map((fb) => ({
  ...fb,
  user: maskCustomerName(fb.user),
}));

// After: Filter out 1-star reviews for customers
productData.feedback = productData.feedback
  .filter((fb) => fb.rating > 1) // Filter out 1-star reviews for customers
  .map((fb) => ({
    ...fb,
    user: maskCustomerName(fb.user),
  }));
```

## User Experience

- **Customers**: Only see reviews with 2-5 stars when browsing products
- **Store Owners**: See complete feedback including 1-star reviews in their dashboard
- **Rating Averages**: Remain accurate as they include all submitted ratings

## Benefits

1. **Improved Customer Experience**: Customers see more positive feedback when browsing
2. **Store Owner Accountability**: Store owners can still see and respond to negative feedback
3. **Data Integrity**: All reviews are preserved in the database
4. **Transparency**: Store owners have full visibility into customer satisfaction

## Future Considerations

- Consider adding admin controls to adjust the star rating threshold
- Potential feature to show filtered review counts to store owners
- Option for store owners to flag reviews for admin review

## Testing

To test this feature:

1. Submit reviews with different star ratings (1-5 stars) on a product
2. View the product as a customer - should only see 2-5 star reviews
3. Login as the store owner and check Reviews & Ratings - should see all reviews including 1-star
