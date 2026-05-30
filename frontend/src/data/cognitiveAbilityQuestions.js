/**
 * Cognitive Ability Composite Score (CACS™)
 * Full 19-question bank extracted faithfully from the TestGorilla Notion Page
 */

export const COGNITIVE_ABILITY_QUESTIONS = [
  // ─── Verbal Reasoning (VR) - 5 Questions ───────────────────────
  {
    order: 1,
    dimension: 'vr',
    questionText: 'Determine the logical relationship between the words in bold below, and then choose the pair of words that follows the same logic.\n\nInferior : Substandard',
    options: [
      { text: 'Friend : Foe', isCorrect: false },
      { text: 'Polite : Courteous', isCorrect: true },
      { text: 'Smart : Shabby', isCorrect: false },
      { text: 'Empty : Full', isCorrect: false }
    ],
    difficulty: 'basic',
    explanation: 'Inferior and Substandard are synonyms (words with similar meanings). Polite and Courteous are also synonyms, following the exact same logic.'
  },
  {
    order: 2,
    dimension: 'vr',
    questionText: 'Determine the logical relationship between the words in bold below, and then choose the pair of words that follows the same logic.\n\nApple : Fruit',
    options: [
      { text: 'Wheel : Bicycle', isCorrect: false },
      { text: 'Carrot : Vegetable', isCorrect: true },
      { text: 'Salad : Healthy', isCorrect: false },
      { text: 'Tree : Forest', isCorrect: false }
    ],
    difficulty: 'basic',
    explanation: 'An Apple is a type of Fruit (member-to-category relationship). Similarly, a Carrot is a type of Vegetable.'
  },
  {
    order: 3,
    dimension: 'vr',
    questionText: 'Determine the logical relationship between the words in bold below, and then choose the pair of words that follows the same logic.\n\nBird : Feather',
    options: [
      { text: 'Fish : Water', isCorrect: false },
      { text: 'Cat : Meow', isCorrect: false },
      { text: 'Sun : Hot', isCorrect: false },
      { text: 'Dog : Fur', isCorrect: true }
    ],
    difficulty: 'moderate',
    explanation: 'A bird is covered in feathers. Similarly, a dog is covered in fur (animal-to-covering relationship).'
  },
  {
    order: 4,
    dimension: 'vr',
    questionText: 'Read the following text and determine if the statement that follows it is true, false, or if it cannot be determined based on the information given in the text alone.\n\nText: Scent hounds are prized hunting dogs. They primarily hunt by their keen sense of smell rather than sight. A bloodhound is one such breed that has been widely used for tracking game since medieval times. Their ability to detect even faint scents have endeared them to law enforcement. These agencies use bloodhounds for tracking escaped convicts. Due to their gentle nature, bloodhounds are also considered ideal family pets.\n\nStatement: A bloodhound is a type of scent hound.',
    options: [
      { text: 'True', isCorrect: true },
      { text: 'False', isCorrect: false },
      { text: 'Cannot be determined', isCorrect: false }
    ],
    difficulty: 'moderate',
    explanation: 'The text states: "Scent hounds are prized hunting dogs... A bloodhound is one such breed", which directly confirms that a bloodhound is a type of scent hound.'
  },
  {
    order: 5,
    dimension: 'vr',
    questionText: 'Read the following text and determine if the statement that follows it is true, false, or if it cannot be determined based on the information given in the text alone.\n\nText: The city of Venice, Italy is built on a group of 118 small islands separated by canals and linked by bridges. Because of its unique urban landscape and its historical importance, the city is listed as a World Heritage Site. Venice experiences regular flooding called "acqua alta" that affects the entire city, especially in the fall and winter months.\n\nStatement: Venice is a popular tourist destination.',
    options: [
      { text: 'True', isCorrect: false },
      { text: 'False', isCorrect: false },
      { text: 'Cannot be determined', isCorrect: true }
    ],
    difficulty: 'tough',
    explanation: 'Although Venice is widely known in real life as a tourist destination, the provided text does not mention tourism or tourists. Therefore, based on the text alone, the statement cannot be determined.'
  },

  // ─── Logical / Abstract Reasoning (LR) - 7 Questions ───────────
  {
    order: 6,
    dimension: 'lr',
    questionText: 'Select the option that best completes the logical 3×3 pattern shown below:',
    questionImage: 'cacs-images/logical_3x3.png',
    options: [
      { text: 'Heptagon (7 sides)', image: 'cacs-images/options/q6_a.svg', isCorrect: true },
      { text: 'Pentagon (5 sides)', image: 'cacs-images/options/q6_b.svg', isCorrect: false },
      { text: 'Octagon (8 sides)', image: 'cacs-images/options/q6_c.svg', isCorrect: false },
      { text: 'Circle (0 sides)', image: 'cacs-images/options/q6_d.svg', isCorrect: false },
      { text: 'Triangle (3 sides)', image: 'cacs-images/options/q6_e.svg', isCorrect: false }
    ],
    difficulty: 'moderate',
    explanation: 'The sequence increment in Row 3 progresses as 5 sides ➔ 6 sides ➔ 7 sides. A heptagon has 7 sides.'
  },
  {
    order: 7,
    dimension: 'lr',
    questionText: 'Select the option that completes the logical shape sequence shown below:',
    questionImage: 'cacs-images/logical_sequence_triangles.png',
    options: [
      { text: '[▲▲▲▲▲]', image: 'cacs-images/options/q7_a.svg', isCorrect: true },
      { text: '[▼▼▼▼▼]', image: 'cacs-images/options/q7_b.svg', isCorrect: false },
      { text: '[■■■■■]', image: 'cacs-images/options/q7_c.svg', isCorrect: false },
      { text: '[●●●●●]', image: 'cacs-images/options/q7_d.svg', isCorrect: false },
      { text: '[✦✦✦✦✦]', image: 'cacs-images/options/q7_e.svg', isCorrect: false }
    ],
    difficulty: 'basic',
    explanation: 'The sequence simply adds one identical solid upward-pointing triangle [▲] at each step.'
  },
  {
    order: 8,
    dimension: 'lr',
    questionText: 'Select the option that logically completes the 2×2 matrix relation shown below:',
    questionImage: 'cacs-images/logical_matrix_filled_hollow.png',
    options: [
      { text: '[Hollow Triangle △]', image: 'cacs-images/options/q8_a.svg', isCorrect: true },
      { text: '[Filled Circle ●]', image: 'cacs-images/options/q8_b.svg', isCorrect: false },
      { text: '[Hollow Circle ○]', image: 'cacs-images/options/q8_c.svg', isCorrect: false },
      { text: '[Filled Square ■]', image: 'cacs-images/options/q8_d.svg', isCorrect: false },
      { text: '[Hollow Pentagon ⬡]', image: 'cacs-images/options/q8_e.svg', isCorrect: false }
    ],
    difficulty: 'moderate',
    explanation: 'The logical relationship is: a solid/filled shape transforms into its hollow equivalent. Therefore, a filled triangle transforms into a hollow triangle.'
  },
  {
    order: 9,
    dimension: 'lr',
    questionText: 'Select the option that logically completes the 90-degree clockwise rotation series shown below:',
    questionImage: 'cacs-images/logical_rotation_arrows.png',
    options: [
      { text: '[← (Pointing Left)]', image: 'cacs-images/options/q9_a.svg', isCorrect: true },
      { text: '[↑ (Pointing Up)]', image: 'cacs-images/options/q9_b.svg', isCorrect: false },
      { text: '[↗ (Pointing Diagonal)]', image: 'cacs-images/options/q9_c.svg', isCorrect: false },
      { text: '[↘ (Pointing Diagonal)]', image: 'cacs-images/options/q9_d.svg', isCorrect: false },
      { text: '[↔ (Horizontal Arrow)]', image: 'cacs-images/options/q9_e.svg', isCorrect: false }
    ],
    difficulty: 'basic',
    explanation: 'The arrow rotates exactly 90 degrees clockwise at each step. After pointing Down (↓), it points Left (←).'
  },
  {
    order: 10,
    dimension: 'lr',
    questionText: 'Select the option that logically completes the nested shape relation shown below:',
    questionImage: 'cacs-images/logical_nested_shapes.png',
    options: [
      { text: '[Triangle nested inside a Square]', image: 'cacs-images/options/q10_a.svg', isCorrect: true },
      { text: '[Circle nested inside a Circle]', image: 'cacs-images/options/q10_b.svg', isCorrect: false },
      { text: '[Square nested inside a Square]', image: 'cacs-images/options/q10_c.svg', isCorrect: false },
      { text: '[Rectangle nested inside an Oval]', image: 'cacs-images/options/q10_d.svg', isCorrect: false },
      { text: '[Star nested inside a Hexagon]', image: 'cacs-images/options/q10_e.svg', isCorrect: false }
    ],
    difficulty: 'tough',
    explanation: 'The inner shape of the previous group becomes the outer shape of the next group. Group 3 inner is Square, so Group 4 outer must be Square, containing a Triangle.'
  },
  {
    order: 11,
    dimension: 'lr',
    questionText: 'Select the option that logically matches the pattern of increasing parallel elements shown below:',
    questionImage: 'cacs-images/logical_parallel_lines.png',
    options: [
      { text: '4 vertical parallel lines', image: 'cacs-images/options/q11_a.svg', isCorrect: true },
      { text: '5 intersecting lines', image: 'cacs-images/options/q11_b.svg', isCorrect: false },
      { text: '1 horizontal line', image: 'cacs-images/options/q11_c.svg', isCorrect: false },
      { text: 'A complete grid of lines', image: 'cacs-images/options/q11_d.svg', isCorrect: false },
      { text: 'No lines', image: 'cacs-images/options/q11_e.svg', isCorrect: false }
    ],
    difficulty: 'basic',
    explanation: 'The logic is simple linear increment of parallel lines. Element 4 is 4 vertical parallel lines.'
  },
  {
    order: 12,
    dimension: 'lr',
    questionText: 'Select the option that logically represents the result of flipping the pattern shown below horizontally:',
    questionImage: 'cacs-images/logical_horizontal_flip.png',
    options: [
      { text: 'A square with its left half shaded', image: 'cacs-images/options/q12_a.svg', isCorrect: true },
      { text: 'A square with its right half shaded', image: 'cacs-images/options/q12_b.svg', isCorrect: false },
      { text: 'A square with its top half shaded', image: 'cacs-images/options/q12_c.svg', isCorrect: false },
      { text: 'A square with its bottom half shaded', image: 'cacs-images/options/q12_d.svg', isCorrect: false },
      { text: 'A completely unshaded square', image: 'cacs-images/options/q12_e.svg', isCorrect: false }
    ],
    difficulty: 'moderate',
    explanation: 'Flipping a shape horizontally reverses its left and right sides. Shading on the right side moves to the left side.'
  },

  // ─── Numerical Reasoning (NR) - 5 Questions ────────────────────
  {
    order: 13,
    dimension: 'nr',
    questionText: 'Fifteen people working 5 hours per day can make 30 units of a product in 10 days. Assume that all other factors remain constant, and people of the same efficiency are used to make the same products.\n\nIn how many days can 10 people make 10 units of the product if each of them works 10 hours per day?',
    options: [
      { text: '2.5 days', isCorrect: true },
      { text: '7.5 days', isCorrect: false },
      { text: '12 days', isCorrect: false },
      { text: '26 days', isCorrect: false }
    ],
    difficulty: 'tough',
    explanation: 'Calculations:\n1. Total labor required for 30 units = 15 people * 5 hours/day * 10 days = 750 man-hours.\n2. Labor rate per unit = 750 / 30 = 25 man-hours per unit.\n3. Labor required for 10 units = 10 * 25 = 250 man-hours.\n4. Daily labor of new team = 10 people * 10 hours/day = 100 man-hours per day.\n5. Days required = 250 / 100 = 2.5 days.'
  },
  {
    order: 14,
    dimension: 'nr',
    questionText: 'What is the next number in the following sequence?\n\n6, 17, 39, 72, 116, ?',
    options: [
      { text: '124', isCorrect: false },
      { text: '171', isCorrect: true },
      { text: '139', isCorrect: false },
      { text: '193', isCorrect: false }
    ],
    difficulty: 'tough',
    explanation: 'The differences between consecutive terms increase by multiples of 11:\n- 17 - 6 = 11\n- 39 - 17 = 22\n- 72 - 39 = 33\n- 116 - 72 = 44\n- Next difference = 55. Next term = 116 + 55 = 171.'
  },
  {
    order: 15,
    dimension: 'nr',
    questionText: 'The following table shows a company’s manufacturing costs, overhead costs, total sales, profit, and dividend per shareholder over four years. Assume the relationships among manufacturing cost, overhead, total sales, profit, and dividend per shareholder remain the same over the years.\n\n| Metrics | 2017 | 2018 | 2019 | 2020 |\n| :--- | :--- | :--- | :--- | :--- |\n| Mfg Cost | $500k | $550k | $600k | $650k |\n| Overhead | $100k | $110k | $120k | $130k |\n| Total Sales | $800k | $900k | $1,000k | $1,100k |\n| Profit | $200k | $240k | $280k | $320k |\n| Dividend/Share | ? | $24.00 | $28.00 | $32.00 |\n\nWhat should have been the Dividend per Shareholder in 2017, assuming the number of Shareholders has remained unchanged during the period 2017-2020?',
    options: [
      { text: '$17.45', isCorrect: false },
      { text: '$19.50', isCorrect: false },
      { text: '$20.00', isCorrect: true },
      { text: '$25.00', isCorrect: false }
    ],
    difficulty: 'tough',
    explanation: 'The dividend per shareholder is proportional to the profit (Ratio = Profit / 10,000):\n- In 2018: Profit $240,000 ➔ Dividend $24.00.\n- In 2019: Profit $280,000 ➔ Dividend $28.00.\n- In 2020: Profit $320,000 ➔ Dividend $32.00.\n- For 2017: Profit $200,000 ➔ Dividend should be $200,000 / 10,000 = $20.00.'
  },
  {
    order: 16,
    dimension: 'nr',
    questionText: 'What is the next number in the following series?\n\n3, 6, 12, 24, 48, ?',
    options: [
      { text: '72', isCorrect: false },
      { text: '84', isCorrect: false },
      { text: '96', isCorrect: true },
      { text: '108', isCorrect: false }
    ],
    difficulty: 'basic',
    explanation: 'Each number is exactly twice the previous term: 3 * 2 = 6, 6 * 2 = 12, 12 * 2 = 24, 24 * 2 = 48, 48 * 2 = 96.'
  },
  {
    order: 19,
    dimension: 'nr',
    questionText: 'What is the next number in the following series?\n\n7, 10, 8, 11, 9, 12, ?',
    options: [
      { text: '10', isCorrect: true },
      { text: '11', isCorrect: false },
      { text: '13', isCorrect: false },
      { text: '14', isCorrect: false }
    ],
    difficulty: 'moderate',
    explanation: 'The series follows an alternating pattern of +3 and -2:\n- 7 (+3) ➔ 10 (-2) ➔ 8 (+3) ➔ 11 (-2) ➔ 9 (+3) ➔ 12 (-2) ➔ 10.'
  },

  // ─── Critical Thinking / Data Interpretation (CT) - 2 Questions ─
  {
    order: 17,
    dimension: 'ct',
    questionText: 'Suppose that 40% of 20% of a project’s budget has been spent.\n\nWhich of the following statements is correct?',
    options: [
      { text: 'Less than 1/15th but more than 1/20th of the budget has been spent.', isCorrect: false },
      { text: 'Less than 1/5th but more than 1/10th of the budget has been spent.', isCorrect: false },
      { text: 'Less than 1/10th but more than 1/20th of the budget has been spent.', isCorrect: true },
      { text: 'More than 1/5th of the budget has been spent.', isCorrect: false }
    ],
    difficulty: 'moderate',
    explanation: 'Calculations:\n1. 40% of 20% = 0.40 * 0.20 = 0.08 = 8% of the budget.\n2. 1/10th of budget = 10%.\n3. 1/20th of budget = 5%.\n4. Since 8% is between 5% and 10%, the spent amount is "Less than 1/10th but more than 1/20th of the budget".'
  },
  {
    order: 18,
    dimension: 'ct',
    questionText: 'The following table shows the lead generation for ABC company through Social media platforms:\n\n| Platform | Year 1 | Year 2 | Year 3 |\n| :--- | :--- | :--- | :--- |\n| Platform 1 | 20,000 | 22,000 | 25,000 |\n| Platform 2 | 10,000 | 8,000 | 15,000 |\n| Platform 3 | 9,000 | 17,000 | 21,000 |\n| Platform 4 | 2,000 | 500 | 1,000 |\n| Platform 5 | 12,000 | 15,000 | 16,000 |\n| **Total** | **53,000** | **62,500** | **78,000** |\n\nWhat is the ratio of lead generation of Platform 1 to Platform 5 in Year 3?',
    options: [
      { text: '3:5', isCorrect: false },
      { text: '25:16', isCorrect: true },
      { text: '5:16', isCorrect: false },
      { text: '25:21', isCorrect: false }
    ],
    difficulty: 'moderate',
    explanation: 'Lead generation in Year 3:\n- Platform 1 = 25,000\n- Platform 5 = 16,000\n- Ratio Platform 1 : Platform 5 = 25,000 : 16,000 = 25:16.'
  }
];
