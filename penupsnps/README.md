# Government Pension Simulator (NPS vs UPS)

A comprehensive pension calculator that projects salary growth, DA, promotions, CPC adjustments, and retirement benefits for government employees, comparing both New Pension Scheme (NPS) and Unique Pension Scheme (UPS).

## Features

- **Salary Projection**: Year-by-year salary progression (Basic + DA)
- **CPC Adjustments**: Automatic handling of future CPC fitment changes and DA resets
- **Promotions**: Support for multiple promotions with custom dates and pay levels
- **NPS Calculation**: Corpus growth, withdrawal (60% lump sum), and annuity (40%)
- **UPS Calculation**: Last 10 months average, 50% guaranteed pension, and gratuity
- **Visualization**: Interactive charts and detailed yearly projections

## How to Use

1. **Basic Information**:
   - Enter your current basic pay or select your pay level and index
   - Select your increment month (January or July)
   - Enter the current DA percentage
   - Set your expected retirement date
   - Optionally, enter your current NPS corpus if any

2. **Promotions (Optional)**:
   - Click "+ Add Promotion" to add expected promotions
   - For each promotion, specify the date, new pay level, and index
   - You can add multiple promotions

3. **Calculate**:
   - Click the "Calculate" button to see the results

4. **Results**:
   - View NPS and UPS pension projections side by side
   - Explore the interactive chart showing salary and corpus growth
   - Check the detailed yearly projection table

## Technical Details

- **Pay Matrix**: Based on 7th CPC with provisions for future CPCs
- **DA Calculation**: 3% increase every January and July (compounded)
- **CPC Adjustments**: Every 10 years (2026, 2036, etc.) with fitment factor of 2.0
- **NPS Returns**: 8% annual return (compounded monthly)
- **Annuity Rate**: 6.5% of the annuity corpus
- **UPS Pension**: 50% of the average of last 10 months' emoluments

## Deployment

This is a static web application that can be deployed on any web hosting service. For Cloudflare Pages:

1. Push the code to a GitHub/GitLab repository
2. Log in to Cloudflare Dashboard
3. Go to Pages > Create a project
4. Connect your repository
5. Set the build command to empty (no build step required)
6. Set the build output directory to `/`
7. Deploy!

## Local Development

1. Clone the repository
2. Start a local web server (e.g., `python -m http.server` or `npx http-server`)
3. Open `http://localhost:8000` in your browser

## Browser Support

This application uses modern JavaScript (ES6+) and may not work in older browsers. For best results, use the latest version of Chrome, Firefox, Safari, or Edge.

## Disclaimer

This calculator provides estimates only and should not be considered as financial advice. The actual pension amounts may vary based on government rules and regulations. Always consult with a financial advisor for retirement planning.
