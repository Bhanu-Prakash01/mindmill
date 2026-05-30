const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const User = require('../models/User');

const seedCognitiveAbility = async () => {
  try {
    const existing = await Assessment.findOne({ title: 'Cognitive Ability Composite Assessment' });
    if (existing) {
      console.log('Cognitive Ability Assessment already exists.');
      return;
    }

    const superAdmin = await User.findOne({ role: 'superadmin' });
    if (!superAdmin) {
      console.error('SuperAdmin not found, cannot seed Cognitive Ability Assessment');
      return;
    }

    const assessment = new Assessment({
      title: 'Cognitive Ability Composite Assessment',
      category: 'cognitive',
      subCategory: 'Cognitive ability',
      timeLimit: 1200,
      timeBound: { enabled: true, durationMinutes: 20 },
      difficulty: 'moderate',
      createdBy: superAdmin._id,
      isPublished: true,
      description: 'A comprehensive cognitive ability assessment evaluating Verbal Reasoning (VR), Numerical Reasoning (NR), Logical Reasoning (LR), Critical Thinking (CT), and Working Memory (WM).',
      questions: []
    });

    await assessment.save();

    const rawQuestions = [
      // Verbal Reasoning (VR) - 5 questions
      { text: 'Determine the logical relationship between the words in bold below, and then choose the pair of words that follows the same logic.\n\nInferior : Substandard', type: 'mcq', dimension: 'vr', options: [{ text: 'Friend : Foe', isCorrect: false }, { text: 'Polite : Courteous', isCorrect: true }, { text: 'Smart : Shabby', isCorrect: false }, { text: 'Empty : Full', isCorrect: false }] },
      { text: 'Determine the logical relationship between the words in bold below, and then choose the pair of words that follows the same logic.\n\nApple : Fruit', type: 'mcq', dimension: 'vr', options: [{ text: 'Wheel : Bicycle', isCorrect: false }, { text: 'Carrot : Vegetable', isCorrect: true }, { text: 'Salad : Healthy', isCorrect: false }, { text: 'Tree : Forest', isCorrect: false }] },
      { text: 'Determine the logical relationship between the words in bold below, and then choose the pair of words that follows the same logic.\n\nBird : Feather', type: 'mcq', dimension: 'vr', options: [{ text: 'Fish : Water', isCorrect: false }, { text: 'Cat : Meow', isCorrect: false }, { text: 'Sun : Hot', isCorrect: false }, { text: 'Dog : Fur', isCorrect: true }] },
      { text: 'Read the following text and determine if the statement that follows it is true, false, or if it cannot be determined based on the information given in the text alone.\n\nText: Scent hounds are prized hunting dogs. They primarily hunt by their keen sense of smell rather than sight. A bloodhound is one such breed that has been widely used for tracking game since medieval times. Their ability to detect even faint scents have endeared them to law enforcement. These agencies use bloodhounds for tracking escaped convicts. Due to their gentle nature, bloodhounds are also considered ideal family pets.\n\nStatement: A bloodhound is a type of scent hound.', type: 'mcq', dimension: 'vr', options: [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }, { text: 'Cannot be determined', isCorrect: false }] },
      { text: 'Read the following text and determine if the statement that follows it is true, false, or if it cannot be determined based on the information given in the text alone.\n\nText: The city of Venice, Italy is built on a group of 118 small islands separated by canals and linked by bridges. Because of its unique urban landscape and its historical importance, the city is listed as a World Heritage Site. Venice experiences regular flooding called "acqua alta" that affects the entire city, especially in the fall and winter months.\n\nStatement: Venice is a popular tourist destination.', type: 'mcq', dimension: 'vr', options: [{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: false }, { text: 'Cannot be determined', isCorrect: true }] },

      // Logical Reasoning (LR) - 7 questions
      { text: 'Select the option that best completes the logical 3×3 pattern shown below:', questionImage: 'cacs-images/logical_3x3.png', type: 'mcq', dimension: 'lr', options: [{ text: 'Heptagon (7 sides)', image: 'cacs-images/options/q6_a.svg', isCorrect: true }, { text: 'Pentagon (5 sides)', image: 'cacs-images/options/q6_b.svg', isCorrect: false }, { text: 'Octagon (8 sides)', image: 'cacs-images/options/q6_c.svg', isCorrect: false }, { text: 'Circle (0 sides)', image: 'cacs-images/options/q6_d.svg', isCorrect: false }, { text: 'Triangle (3 sides)', image: 'cacs-images/options/q6_e.svg', isCorrect: false }] },
      { text: 'Select the option that completes the logical shape sequence shown below:', questionImage: 'cacs-images/logical_sequence_triangles.png', type: 'mcq', dimension: 'lr', options: [{ text: '[▲▲▲▲▲]', image: 'cacs-images/options/q7_a.svg', isCorrect: true }, { text: '[▼▼▼▼▼]', image: 'cacs-images/options/q7_b.svg', isCorrect: false }, { text: '[■■■■■]', image: 'cacs-images/options/q7_c.svg', isCorrect: false }, { text: '[●●●●●]', image: 'cacs-images/options/q7_d.svg', isCorrect: false }, { text: '[✦✦✦✦✦]', image: 'cacs-images/options/q7_e.svg', isCorrect: false }] },
      { text: 'Select the option that logically completes the 2×2 matrix relation shown below:', questionImage: 'cacs-images/logical_matrix_filled_hollow.png', type: 'mcq', dimension: 'lr', options: [{ text: '[Hollow Triangle △]', image: 'cacs-images/options/q8_a.svg', isCorrect: true }, { text: '[Filled Circle ●]', image: 'cacs-images/options/q8_b.svg', isCorrect: false }, { text: '[Hollow Circle ○]', image: 'cacs-images/options/q8_c.svg', isCorrect: false }, { text: '[Filled Square ■]', image: 'cacs-images/options/q8_d.svg', isCorrect: false }, { text: '[Hollow Pentagon ⬡]', image: 'cacs-images/options/q8_e.svg', isCorrect: false }] },
      { text: 'Select the option that logically completes the 90-degree clockwise rotation series shown below:', questionImage: 'cacs-images/logical_rotation_arrows.png', type: 'mcq', dimension: 'lr', options: [{ text: '[← (Pointing Left)]', image: 'cacs-images/options/q9_a.svg', isCorrect: true }, { text: '[↑ (Pointing Up)]', image: 'cacs-images/options/q9_b.svg', isCorrect: false }, { text: '[↗ (Pointing Diagonal)]', image: 'cacs-images/options/q9_c.svg', isCorrect: false }, { text: '[↘ (Pointing Diagonal)]', image: 'cacs-images/options/q9_d.svg', isCorrect: false }, { text: '[↔ (Horizontal Arrow)]', image: 'cacs-images/options/q9_e.svg', isCorrect: false }] },
      { text: 'Select the option that logically completes the nested shape relation shown below:', questionImage: 'cacs-images/logical_nested_shapes.png', type: 'mcq', dimension: 'lr', options: [{ text: '[Triangle nested inside a Square]', image: 'cacs-images/options/q10_a.svg', isCorrect: true }, { text: '[Circle nested inside a Circle]', image: 'cacs-images/options/q10_b.svg', isCorrect: false }, { text: '[Square nested inside a Square]', image: 'cacs-images/options/q10_c.svg', isCorrect: false }, { text: '[Rectangle nested inside an Oval]', image: 'cacs-images/options/q10_d.svg', isCorrect: false }, { text: '[Star nested inside a Hexagon]', image: 'cacs-images/options/q10_e.svg', isCorrect: false }] },
      { text: 'Select the option that logically matches the pattern of increasing parallel elements shown below:', questionImage: 'cacs-images/logical_parallel_lines.png', type: 'mcq', dimension: 'lr', options: [{ text: '4 vertical parallel lines', image: 'cacs-images/options/q11_a.svg', isCorrect: true }, { text: '5 intersecting lines', image: 'cacs-images/options/q11_b.svg', isCorrect: false }, { text: '1 horizontal line', image: 'cacs-images/options/q11_c.svg', isCorrect: false }, { text: 'A complete grid of lines', image: 'cacs-images/options/q11_d.svg', isCorrect: false }, { text: 'No lines', image: 'cacs-images/options/q11_e.svg', isCorrect: false }] },
      { text: 'Select the option that logically represents the result of flipping the pattern shown below horizontally:', questionImage: 'cacs-images/logical_horizontal_flip.png', type: 'mcq', dimension: 'lr', options: [{ text: 'A square with its left half shaded', image: 'cacs-images/options/q12_a.svg', isCorrect: true }, { text: 'A square with its right half shaded', image: 'cacs-images/options/q12_b.svg', isCorrect: false }, { text: 'A square with its top half shaded', image: 'cacs-images/options/q12_c.svg', isCorrect: false }, { text: 'A square with its bottom half shaded', image: 'cacs-images/options/q12_d.svg', isCorrect: false }, { text: 'A completely unshaded square', image: 'cacs-images/options/q12_e.svg', isCorrect: false }] },

      // Numerical Reasoning (NR) - 5 questions
      { text: 'Fifteen people working 5 hours per day can make 30 units of a product in 10 days. Assume that all other factors remain constant, and people of the same efficiency are used to make the same products.\n\nIn how many days can 10 people make 10 units of the product if each of them works 10 hours per day?', type: 'mcq', dimension: 'nr', options: [{ text: '2.5 days', isCorrect: true }, { text: '7.5 days', isCorrect: false }, { text: '12 days', isCorrect: false }, { text: '26 days', isCorrect: false }] },
      { text: 'What is the next number in the following sequence?\n\n6, 17, 39, 72, 116, ?', type: 'mcq', dimension: 'nr', options: [{ text: '124', isCorrect: false }, { text: '171', isCorrect: true }, { text: '139', isCorrect: false }, { text: '193', isCorrect: false }] },
      { text: 'The following table shows a company’s manufacturing costs, overhead costs, total sales, profit, and dividend per shareholder over four years. Assume the relationships among manufacturing cost, overhead, total sales, profit, and dividend per shareholder remain the same over the years.\n\n| Metrics | 2017 | 2018 | 2019 | 2020 |\n| :--- | :--- | :--- | :--- | :--- |\n| Mfg Cost | $500k | $550k | $600k | $650k |\n| Overhead | $100k | $110k | $120k | $130k |\n| Total Sales | $800k | $900k | $1,000k | $1,100k |\n| Profit | $200k | $240k | $280k | $320k |\n| Dividend/Share | ? | $24.00 | $28.00 | $32.00 |\n\nWhat should have been the Dividend per Shareholder in 2017, assuming the number of Shareholders has remained unchanged during the period 2017-2020?', type: 'mcq', dimension: 'nr', options: [{ text: '$17.45', isCorrect: false }, { text: '$19.50', isCorrect: false }, { text: '$20.00', isCorrect: true }, { text: '$25.00', isCorrect: false }] },
      { text: 'What is the next number in the following series?\n\n3, 6, 12, 24, 48, ?', type: 'mcq', dimension: 'nr', options: [{ text: '72', isCorrect: false }, { text: '84', isCorrect: false }, { text: '96', isCorrect: true }, { text: '108', isCorrect: false }] },
      { text: 'What is the next number in the following series?\n\n7, 10, 8, 11, 9, 12, ?', type: 'mcq', dimension: 'nr', options: [{ text: '10', isCorrect: true }, { text: '11', isCorrect: false }, { text: '13', isCorrect: false }, { text: '14', isCorrect: false }] },

      // Critical Thinking (CT) - 2 questions
      { text: 'Suppose that 40% of 20% of a project’s budget has been spent.\n\nWhich of the following statements is correct?', type: 'mcq', dimension: 'ct', options: [{ text: 'Less than 1/15th but more than 1/20th of the budget has been spent.', isCorrect: false }, { text: 'Less than 1/5th but more than 1/10th of the budget has been spent.', isCorrect: false }, { text: 'Less than 1/10th but more than 1/20th of the budget has been spent.', isCorrect: true }, { text: 'More than 1/5th of the budget has been spent.', isCorrect: false }] },
      { text: 'The following table shows the lead generation for ABC company through Social media platforms:\n\n| Platform | Year 1 | Year 2 | Year 3 |\n| :--- | :--- | :--- | :--- |\n| Platform 1 | 20,000 | 22,000 | 25,000 |\n| Platform 2 | 10,000 | 8,000 | 15,000 |\n| Platform 3 | 9,000 | 17,000 | 21,000 |\n| Platform 4 | 2,000 | 500 | 1,000 |\n| Platform 5 | 12,000 | 15,000 | 16,000 |\n| **Total** | **53,000** | **62,500** | **78,000** |\n\nWhat is the ratio of lead generation of Platform 1 to Platform 5 in Year 3?', type: 'mcq', dimension: 'ct', options: [{ text: '3:5', isCorrect: false }, { text: '25:16', isCorrect: true }, { text: '5:16', isCorrect: false }, { text: '25:21', isCorrect: false }] }
    ];

    const savedQuestions = [];
    let orderCounter = 1;
    for (const q of rawQuestions) {
      const newQuestion = new Question({
        assessment: assessment._id,
        questionText: q.text,
        questionImage: q.questionImage || null,
        type: q.type,
        dimension: q.dimension,
        options: q.options,
        order: orderCounter++
      });
      await newQuestion.save();
      savedQuestions.push(newQuestion._id);
    }

    assessment.questions = savedQuestions;
    assessment.totalQuestions = savedQuestions.length;
    await assessment.save();

    console.log('Cognitive Ability Assessment seeded successfully.');
  } catch (error) {
    console.error('Error seeding Cognitive Ability Assessment:', error);
    throw error; // Re-throw to fail the seed process
  }
};

module.exports = seedCognitiveAbility;
