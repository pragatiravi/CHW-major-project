/**
 * ThinkLets Counselling Scripts & Guidelines
 * Provides interactive, structured counselling protocols for Community Health Workers.
 */

export const THINKLETS_SCRIPTS = [
  {
    id: 'diabetes_management',
    category: 'Diabetes',
    title: 'Type 2 Diabetes Education & Glucose Control',
    icon: '🩸',
    description: 'Structured counselling script for explaining blood glucose control, symptoms, and dietary discipline.',
    targetRisk: ['Moderate', 'High', 'Critical'],
    steps: [
      {
        id: 'step_1',
        title: 'Explain Blood Sugar Basics',
        script: '“Hello [Patient Name]. Your blood sugar reading today is [Glucose] mg/dL. Normal fasting blood sugar is between 70 and 99 mg/dL. When blood sugar stays high, it places strain on your blood vessels, eyes, and kidneys.”',
        actionItem: 'Confirm patient understands what their glucose reading means.'
      },
      {
        id: 'step_2',
        title: 'Identify Warning Symptoms',
        script: '“Please inform us immediately if you experience frequent urination at night, unquenchable thirst, extreme tiredness, or blurry vision. These are warning signs that sugar is accumulating in your blood.”',
        actionItem: 'Ask patient if they have experienced thirst, frequent urination, or blurred vision this week.'
      },
      {
        id: 'step_3',
        title: 'Dietary Carbs & Sugar Swap',
        script: '“Avoid refined sugars, sweet tea, soda, and deep-fried snacks. Switch white rice to brown rice, millet, or whole grains. Fill half your plate with leafy vegetables like spinach, cabbage, or greens.”',
        actionItem: 'Review patient daily breakfast and lunch choices.'
      },
      {
        id: 'step_4',
        title: 'Medication Discipline',
        script: '“If prescribed oral diabetes medicines (like Metformin), take them regularly with meals. Never skip doses even when you feel completely fine, as diabetes often has no symptoms in early stages.”',
        actionItem: 'Verify patient medication intake schedule.'
      }
    ]
  },
  {
    id: 'hypertension_control',
    category: 'Hypertension',
    title: 'High Blood Pressure Management & Sodium Restriction',
    icon: '❤️',
    description: 'Guidance script on reducing salt intake, monitoring BP, and preventing hypertensive emergencies.',
    targetRisk: ['Moderate', 'High', 'Critical'],
    steps: [
      {
        id: 'step_1',
        title: 'Explain Blood Pressure Reading',
        script: '“Your blood pressure today is [BP_Systolic]/[BP_Diastolic] mmHg. Blood pressure is the force of blood pushing against the walls of your arteries. Keeping it under 120/80 mmHg protects your heart and brain.”',
        actionItem: 'Explain upper (systolic) and lower (diastolic) numbers.'
      },
      {
        id: 'step_2',
        title: 'Salt & Sodium Reduction Routine',
        script: '“Salt attracts water in your bloodstream, raising your blood pressure. Do not add raw salt to cooked meals. Avoid processed pickles, canned soups, and salty snacks. Use herbs, lemon, or garlic for flavor.”',
        actionItem: 'Goal: Limit total daily salt to under 1 level teaspoon (5 grams).'
      },
      {
        id: 'step_3',
        title: 'Recognizing Hypertensive Warning Signs',
        script: '“If you experience severe headache, dizziness, sudden chest tightness, or trouble breathing, contact your CHW or visit the health clinic immediately. Do not ignore these signals.”',
        actionItem: 'Provide emergency health clinic contact card.'
      }
    ]
  },
  {
    id: 'diet_nutrition',
    category: 'Diet',
    title: 'Community Heart & Metabolic Meal Plan',
    icon: '🥗',
    description: 'Practical dietary recommendations tailored for rural and community culinary habits.',
    targetRisk: ['Low', 'Moderate', 'High', 'Critical'],
    steps: [
      {
        id: 'step_1',
        title: 'The Healthy Community Plate Method',
        script: '“Divide your daily food plate into 3 parts: 50% non-starchy green vegetables, 25% plant proteins (dal, beans, lentils) or lean fish, and 25% whole grains (millet, oats, brown rice).”',
        actionItem: 'Draw or show the Healthy Plate diagram to patient.'
      },
      {
        id: 'step_2',
        title: 'Healthy Cooking Oil Choices',
        script: '“Reuse of fried cooking oil causes inflammation in blood vessels. Limit total oil usage to no more than 2-3 teaspoons per person per day. Prefer mustard, sunflower, or olive oil over palm oil.”',
        actionItem: 'Ask how much cooking oil the household uses per month.'
      },
      {
        id: 'step_3',
        title: 'Hydration & Water Intake',
        script: '“Drink at least 8 to 10 glasses of clean water daily. Avoid commercial fruit juices and energy drinks as they contain hidden sugars.”',
        actionItem: 'Encourage carrying a refillable water flask.'
      }
    ]
  },
  {
    id: 'exercise_activity',
    category: 'Exercise',
    title: 'Physical Activity & Daily Exertion Guidelines',
    icon: '🏃',
    description: 'Safe aerobic activity goals to improve insulin sensitivity and lower vascular resistance.',
    targetRisk: ['Low', 'Moderate', 'High'],
    steps: [
      {
        id: 'step_1',
        title: '30-Minute Daily Brisk Walk',
        script: '“Aim for at least 30 minutes of continuous brisk walking 5 days a week. You should be walking fast enough that you can talk, but not sing.”',
        actionItem: 'Identify a safe walking path or group in patient community.'
      },
      {
        id: 'step_2',
        title: 'Breaking Prolonged Sitting',
        script: '“If you sit for long periods while working or watching TV, stand up and stretch every 45 minutes for 3-5 minutes to keep circulation active.”',
        actionItem: 'Suggest setting a periodic timer or reminder.'
      }
    ]
  },
  {
    id: 'medication_adherence',
    category: 'Medication',
    title: 'Medication Tracking & Pill Routine Discipline',
    icon: '💊',
    description: 'Counseling on keeping a pill box, tracking missed doses, and managing side effects.',
    targetRisk: ['Moderate', 'High', 'Critical'],
    steps: [
      {
        id: 'step_1',
        title: 'Establishing a Pill Habit Trigger',
        script: '“Pair taking your daily medication with an existing daily habit, such as brushing teeth or morning tea, so you never forget a dose.”',
        actionItem: 'Identify the patient daily habit trigger.'
      },
      {
        id: 'step_2',
        title: 'What to Do if a Dose is Missed',
        script: '“If you miss a dose, take it as soon as you remember. However, if it is almost time for your next dose, skip the missed dose. Never double up pills to make up for a missed dose.”',
        actionItem: 'Confirm understanding of missed dose safety rule.'
      }
    ]
  },
  {
    id: 'lifestyle_habits',
    category: 'Lifestyle Changes',
    title: 'Tobacco Cessation & Alcohol Reduction',
    icon: '🚭',
    description: 'Empathetic script for reducing tobacco and alcohol dependency.',
    targetRisk: ['Low', 'Moderate', 'High', 'Critical'],
    steps: [
      {
        id: 'step_1',
        title: 'Understanding Tobacco Damage',
        script: '“Every cigarette or bidi smoked causes instant arterial spasm and raises blood pressure for up to 30 minutes. Quitting tobacco reduces heart attack risk by 50% within 1 year.”',
        actionItem: 'Assess patient readiness to quit on a scale of 1-10.'
      },
      {
        id: 'step_2',
        title: 'Managing Craving Triggers',
        script: '“When you feel a strong urge to smoke, drink a cold glass of water, chew fennel seeds or clove, and take 5 deep slow breaths until the craving passes.”',
        actionItem: 'Distribute craving substitute tips card.'
      }
    ]
  },
  {
    id: 'stress_management',
    category: 'Stress Management',
    title: 'Mindfulness & Stress Relief for Chronic Health',
    icon: '🧘',
    description: 'Simple breathing exercises and sleep hygiene to reduce cortisol spikes.',
    targetRisk: ['Low', 'Moderate', 'High'],
    steps: [
      {
        id: 'step_1',
        title: '4-7-8 Breathing Technique',
        script: '“Inhale slowly through your nose for 4 seconds, hold breath for 7 seconds, and exhale slowly through mouth for 8 seconds. Repeat 4 times to instantly lower heart rate.”',
        actionItem: 'Practice one cycle of 4-7-8 breathing together with patient.'
      },
      {
        id: 'step_2',
        title: 'Sleep Hygiene Checklist',
        script: '“Ensure 7-8 hours of uninterrupted sleep every night. Keep sleeping area dark and avoid mobile phone screens 30 minutes before bedtime.”',
        actionItem: 'Set target bedtime routine.'
      }
    ]
  }
];
