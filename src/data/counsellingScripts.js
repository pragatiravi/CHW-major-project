/**
 * ThinkLets Counselling Scripts & Guidelines
 * Provides interactive, structured counselling protocols for Community Health Workers.
 * Fully localized for English (en), Kannada (kn), Hindi (hi), and Marathi (mr).
 */

export const LOCALIZED_SCRIPTS = {
  en: [
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
          script: '“If prescribed oral diabetes medicines, take them regularly with meals. Never skip doses even when you feel completely fine, as diabetes often has no symptoms in early stages.”',
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
          script: '“Salt attracts water in your bloodstream, raising your blood pressure. Do not add raw salt to cooked meals. Avoid processed pickles, canned foods, and salty snacks. Use lemon or garlic for flavor.”',
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
      category: 'Diet & Nutrition',
      title: 'Community Heart & Metabolic Meal Plan',
      icon: '🥗',
      description: 'Practical dietary recommendations tailored for rural and community culinary habits.',
      targetRisk: ['Low', 'Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'The Healthy Community Plate Method',
          script: '“Divide your daily food plate into 3 parts: 50% non-starchy green vegetables, 25% plant proteins (dal, beans, lentils) or eggs, and 25% whole grains (millet, jowar, brown rice).”',
          actionItem: 'Draw or show the Healthy Plate diagram to patient.'
        },
        {
          id: 'step_2',
          title: 'Healthy Cooking Oil Choices',
          script: '“Reuse of fried cooking oil causes inflammation in blood vessels. Limit total oil usage to no more than 2-3 teaspoons per person per day. Avoid palm oil and vanaspati ghee.”',
          actionItem: 'Ask how much cooking oil the household uses per month.'
        }
      ]
    },
    {
      id: 'exercise_activity',
      category: 'Physical Activity',
      title: 'Daily Exertion & Brisk Walking Guidelines',
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
          script: '“If you sit for long periods while working or resting, stand up and stretch every 45 minutes for 3-5 minutes to keep circulation active.”',
          actionItem: 'Suggest setting a periodic reminder.'
        }
      ]
    },
    {
      id: 'medication_adherence',
      category: 'Medication Discipline',
      title: 'Pill Routine Discipline & Habit Triggers',
      icon: '💊',
      description: 'Counseling on keeping a pill box, tracking missed doses, and managing timing.',
      targetRisk: ['Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'Establishing a Pill Habit Trigger',
          script: '“Pair taking your daily medication with an existing daily habit, such as morning tea or brushing teeth, so you never forget a dose.”',
          actionItem: 'Identify the patient daily habit trigger.'
        },
        {
          id: 'step_2',
          title: 'What to Do if a Dose is Missed',
          script: '“If you miss a dose, take it as soon as you remember. However, if it is almost time for your next dose, skip the missed dose. Never take two pills at once.”',
          actionItem: 'Confirm understanding of missed dose safety rule.'
        }
      ]
    }
  ],

  kn: [
    {
      id: 'diabetes_management',
      category: 'ಮಧುಮೇಹ (Diabetes)',
      title: 'ಮಧುಮೇಹ ನಿರ್ವಹಣೆ ಮತ್ತು ರಕ್ತದ ಸಕ್ಕರೆ ನಿಯಂತ್ರಣ',
      icon: '🩸',
      description: 'ರಕ್ತದ ಗ್ಲೂಕೋಸ್ ನಿಯಂತ್ರಣ, ಲಕ್ಷಣಗಳು ಮತ್ತು ಆಹಾರ ಶಿಸ್ತನ್ನು ವಿವರಿಸುವ ಮಾರ್ಗದರ್ಶಿ ಸಂಭಾಷಣೆ.',
      targetRisk: ['Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'ರಕ್ತದ ಸಕ್ಕರೆ ಮಟ್ಟವನ್ನು ವಿವರಿಸಿ',
          script: '“ನಮಸ್ಕಾರ [Patient Name]. ನಿಮ್ಮ ಇಂದಿನ ರಕ್ತದ ಸಕ್ಕರೆ ಪ್ರಮಾಣ [Glucose] mg/dL ಇದೆ. ಸಾಮಾನ್ಯ ಖಾಲಿ ಹೊಟ್ಟೆಯ ಸಕ್ಕರೆ 70 ರಿಂದ 99 mg/dL ನಡುವೆ ಇರಬೇಕು. ಸಕ್ಕರೆ ಮಟ್ಟ ಹೆಚ್ಚಾಗಿದ್ದಾಗ ಅದು ರಕ್ತನಾಳಗಳು, ಕಣ್ಣುಗಳು ಮತ್ತು ಮೂತ್ರಪಿಂಡಗಳ ಮೇಲೆ ಒತ್ತಡವನ್ನುಂಟುಮಾಡುತ್ತದೆ.”',
          actionItem: 'ರೋಗಿಗೆ ತಮ್ಮ ಸಕ್ಕರೆಯ ಮಟ್ಟದ ಅರ್ಥ ತಿಳಿದಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.'
        },
        {
          id: 'step_2',
          title: 'ಎಚ್ಚರಿಕೆಯ ಲಕ್ಷಣಗಳನ್ನು ಗುರುತಿಸಿ',
          script: '“ರಾತ್ರಿ ವೇಳೆ ಪದೇ ಪದೇ ಮೂತ್ರ ವಿಸರ್ಜನೆ, ಅತಿಯಾದ ಬಾಯಾರಿಕೆ, ವಿಪರೀತ ಆಯಾಸ ಅಥವಾ ಮಂಜಾದ ದೃಷ್ಟಿ ಕಂಡುಬಂದರೆ ನಮಗೆ ತಕ್ಷಣ ತಿಳಿಸಿ. ಇವು ರಕ್ತದಲ್ಲಿ ಸಕ್ಕರೆ ಹೆಚ್ಚಾಗುತ್ತಿರುವುದರ ಮುನ್ಸೂಚನೆಗಳು.”',
          actionItem: 'ಈ ವಾರದಲ್ಲಿ ರೋಗಿಗೆ ಅತಿಯಾದ ಬಾಯಾರಿಕೆ ಅಥವಾ ಆಯಾಸ ಕಾಣಿಸಿಕೊಂಡಿದೆಯೇ ಎಂದು ವಿಚಾರಿಸಿ.'
        },
        {
          id: 'step_3',
          title: 'ಆಹಾರದಲ್ಲಿ ಬದಲಾವಣೆ ಮತ್ತು ಸಕ್ಕರೆ ತ್ಯಾಗ',
          script: '“ಸಿಹಿ ಚಹಾ, ತಂಪು ಪಾನೀಯಗಳು ಮತ್ತು ಕರಿದ ತಿಂಡಿಗಳನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಬಿಡಿ. ಬಿಳಿ ಅಕ್ಕಿಯ ಬದಲಾಗಿ ಸಿರಿಧಾನ್ಯಗಳು, ಜೋಳ ಅಥವಾ ರಾಗಿಯನ್ನು ಬಳಸಿ. ನಿಮ್ಮ ತಟ್ಟೆಯ ಅರ್ಧ ಭಾಗವನ್ನು ಹಸಿರು ತರಕಾರಿಗಳಿಂದ ತುಂಬಿಸಿ.”',
          actionItem: 'ರೋಗಿಯ ದೈನಂದಿನ ಊಟದ ಅಭ್ಯಾಸವನ್ನು ಪರಿಶೀಲಿಸಿ.'
        },
        {
          id: 'step_4',
          title: 'ಔಷಧ ಸೇವನೆಯ ಶಿಸ್ತು',
          script: '“ವೈದ್ಯರು ಬರೆದ ಮಧುಮೇಹದ ಮಾತ್ರೆಗಳನ್ನು ಪ್ರತಿದಿನ ನಿಗದಿತ ಸಮಯಕ್ಕೆ ತಪ್ಪದೇ ತೆಗೆದುಕೊಳ್ಳಿ. ನಿಮಗೆ ಯಾವುದೇ ತೊಂದರೆ ಅನಿಸದಿದ್ದರೂ ಮಾತ್ರೆ ನಿಲ್ಲಿಸಬೇಡಿ.”',
          actionItem: 'ರೋಗಿಯ ಮಾತ್ರೆ ಸೇವನೆಯ ವೇಳಾಪಟ್ಟಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.'
        }
      ]
    },
    {
      id: 'hypertension_control',
      category: 'ರಕ್ತದೊತ್ತಡ (BP)',
      title: 'ಅಧಿಕ ರಕ್ತದೊತ್ತಡ ನಿಯಂತ್ರಣ ಮತ್ತು ಉಪ್ಪು ಕಡಿತ',
      icon: '❤️',
      description: 'ಉಪ್ಪಿನ ಸೇವನೆ ಕಡಿಮೆ ಮಾಡಲು ಮತ್ತು ಬಿ.ಪಿ ನಿಯಂತ್ರಿಸಲು ರೋಗಿಗೆ ನೀಡಬೇಕಾದ ಮಾರ್ಗದರ್ಶನ.',
      targetRisk: ['Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'ರಕ್ತದೊತ್ತಡದ ಅಳತೆಯನ್ನು ತಿಳಿಸಿ',
          script: '“ನಿಮ್ಮ ಇಂದಿನ ರಕ್ತದೊತ್ತಡ [BP_Systolic]/[BP_Diastolic] mmHg ಇದೆ. ರಕ್ತದೊತ್ತಡವನ್ನು 120/80 ರ ಒಳಗೆ ಇಟ್ಟುಕೊಳ್ಳುವುದು ನಿಮ್ಮ ಹೃದಯ ಮತ್ತು ಮೆದುಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿರಿಸುತ್ತದೆ.”',
          actionItem: 'ಮೇಲಿನ ಮತ್ತು ಕೆಳಗಿನ ರಕ್ತದೊತ್ತಡದ ಅಂಕಿಗಳನ್ನು ರೋಗಿಗೆ ಅರ್ಥವಾಗುವಂತೆ ತಿಳಿಸಿ.'
        },
        {
          id: 'step_2',
          title: 'ಉಪ್ಪಿನ ಪ್ರಮಾಣವನ್ನು ಕಡಿಮೆ ಮಾಡುವ ನಿಯಮ',
          script: '“ಉಪ್ಪು ರಕ್ತದೊತ್ತಡವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ. ಅಡುಗೆಯ ಮೇಲೆ ಹಸಿ ಉಪ್ಪು ಹಾಕಿಕೊಳ್ಳಬೇಡಿ. ಉಪ್ಪಿನಕಾಯಿ, ಹಪ್ಪಳ ಮತ್ತು ಮಸಾಲೆಯುಕ್ತ ಕುರುಕಲು ತಿಂಡಿಗಳನ್ನು ಬಿಡಿ. ರುಚಿಗೆ ನಿಂಬೆಹಣ್ಣು ಬಳಸಿ.”',
          actionItem: 'ದಿನಕ್ಕೆ 1 ಟೀಚಮಚಕ್ಕಿಂತ ಕಡಿಮೆ ಉಪ್ಪು ಬಳಸುವ ಗುರಿ ನಿಗದಿಪಡಿಸಿ.'
        },
        {
          id: 'step_3',
          title: 'ತುರ್ತು ಎಚ್ಚರಿಕೆಯ ಸಂಕೇತಗಳು',
          script: '“ತೀವ್ರ ತಲೆನೋವು, ತಲೆಸುತ್ತು, ಎದೆ ಬಿಗಿತ ಅಥವಾ ಉಸಿರಾಟದ ತೊಂದರೆ ಕಂಡುಬಂದರೆ ತಕ್ಷಣ ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ಅಥವಾ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ.”',
          actionItem: 'ತುರ್ತು ಆಸ್ಪತ್ರೆಯ ಸಂಪರ್ಕ ಸಂಖ್ಯೆಯನ್ನು ರೋಗಿಗೆ ನೀಡಿ.'
        }
      ]
    },
    {
      id: 'diet_nutrition',
      category: 'ಆಹಾರ ಪದ್ಧತಿ',
      title: 'ಗ್ರಾಮೀಣ ಆರೋಗ್ಯಕರ ಸಮತೋಲಿತ ಆಹಾರ ಯೋಜನೆ',
      icon: '🥗',
      description: 'ಸ್ಥಳೀಯ ಆಹಾರ ಪದ್ಧತಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಪೌಷ್ಟಿಕ ಆಹಾರ ಸಲಹೆಗಳು.',
      targetRisk: ['Low', 'Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'ಆರೋಗ್ಯಕರ ತಟ್ಟೆಯ ವಿಧಾನ',
          script: '“ನಿಮ್ಮ ಊಟದ ತಟ್ಟೆಯಲ್ಲಿ 50% ಹಸಿರು ತರಕಾರಿಗಳು ಮತ್ತು ಸೊಪ್ಪು, 25% ಕಾಳುಗಳು ಅಥವಾ ಮೊಟ್ಟೆ, ಮತ್ತು 25% ಜೋಳ ಅಥವಾ ರಾಗಿ ಮುದ್ದೆ ಇರಲಿ.”',
          actionItem: 'ಆರೋಗ್ಯಕರ ತಟ್ಟೆಯ ಚಿತ್ರವನ್ನು ತೋರಿಸಿ.'
        },
        {
          id: 'step_2',
          title: 'ಅಡುಗೆ ಎಣ್ಣೆಯ ನಿಯಂತ್ರಣ',
          script: '“ಕರಿದ ಎಣ್ಣೆಯನ್ನು ಮತ್ತೆ ಬಳಸಬೇಡಿ. ಒಬ್ಬ ವ್ಯಕ್ತಿಗೆ ದಿನಕ್ಕೆ 2-3 ಚಮಚಕ್ಕಿಂತ ಹೆಚ್ಚು ಎಣ್ಣೆ ಬಳಸಬಾರದು. ವನಸ್ಪತಿ ತುಪ್ಪವನ್ನು ತ್ಯಜಿಸಿ.”',
          actionItem: 'ತಿಂಗಳಿಗೆ ಕುಟುಂಬ ಎಷ್ಟು ಎಣ್ಣೆ ಬಳಸುತ್ತದೆ ಎಂದು ತಿಳಿದುಕೊಳ್ಳಿ.'
        }
      ]
    },
    {
      id: 'exercise_activity',
      category: 'ದೈಹಿಕ ಚಟುವಟಿಕೆ',
      title: 'ದೈನಂದಿನ ಚುರುಕಾದ ನಡಿಗೆ ಮತ್ತು ವ್ಯಾಯಾಮ',
      icon: '🏃',
      description: 'ಇನ್ಸುಲಿನ್ ಕಾರ್ಯಕ್ಷಮತೆಯನ್ನು ಹೆಚ್ಚಿಸಲು ಸರಳ ನಡಿಗೆ ಮಾರ್ಗದರ್ಶಿ.',
      targetRisk: ['Low', 'Moderate', 'High'],
      steps: [
        {
          id: 'step_1',
          title: 'ದಿನಕ್ಕೆ 30 ನಿಮಿಷಗಳ ಚುರುಕಾದ ನಡಿಗೆ',
          script: '“ವಾರಕ್ಕೆ 5 ದಿನಗಳು ಕನಿಷ್ಠ 30 ನಿಮಿಷಗಳ ಕಾಲ ಚುರುಕಾಗಿ ನಡೆಯಿರಿ. ನೀವು ಮಾತನಾಡುವಷ್ಟು ವೇಗದಲ್ಲಿ ನಡೆಯಬೇಕು.”',
          actionItem: 'ಗ್ರಾಮದಲ್ಲಿ ಸುರಕ್ಷಿತ ನಡಿಗೆ ಮಾರ್ಗವನ್ನು ಸೂಚಿಸಿ.'
        },
        {
          id: 'step_2',
          title: 'ನಿರಂತರ ಕೂರುವುದನ್ನು ತಪ್ಪಿಸಿ',
          script: '“ಕೆಲಸ ಮಾಡುವಾಗ ಅಥವಾ ವಿಶ್ರಾಂತಿ ಪಡೆಯುವಾಗ ದೀರ್ಘಕಾಲ ಕುಳಿತುಕೊಳ್ಳಬೇಡಿ. ಪ್ರತಿ 45 ನಿಮಿಷಕ್ಕೊಮ್ಮೆ ಎದ್ದು 3-5 ನಿಮಿಷ ನಡೆದಾಡಿ.”',
          actionItem: 'ಸಮಯದ ಎಚ್ಚರಿಕೆಯನ್ನು ಇಟ್ಟುಕೊಳ್ಳಲು ಸಲಹೆ ನೀಡಿ.'
        }
      ]
    },
    {
      id: 'medication_adherence',
      category: 'ಮಾತ್ರೆ ಸೇವನೆ ಶಿಸ್ತು',
      title: 'ಮಾತ್ರೆ ಸೇವನೆಯ ದಿನಚರಿ ಮತ್ತು ನಿಯಮಗಳು',
      icon: '💊',
      description: 'ಮಾತ್ರೆ ಮರೆತುಹೋಗುವುದನ್ನು ತಪ್ಪಿಸಲು ಅಭ್ಯಾಸದ ನಿಯಮ.',
      targetRisk: ['Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'ದೈನಂದಿನ ಅಭ್ಯಾಸದ ಜೊತೆ ಜೋಡಿಸಿ',
          script: '“ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳುವುದನ್ನು ಬೆಳಗ್ಗಿನ ಚಹಾ ಅಥವಾ ಹಲ್ಲುಜ್ಜುವ ಅಭ್ಯಾಸದ ಜೊತೆಗೆ ಜೋಡಿಸಿ, ಇದರಿಂದ ಮಾತ್ರೆ ಮರೆಯುವುದಿಲ್ಲ.”',
          actionItem: 'ರೋಗಿಯ ಸೂಕ್ತ ಸಮಯವನ್ನು ಗುರುತಿಸಿ.'
        },
        {
          id: 'step_2',
          title: 'ಮಾತ್ರೆ ಮರೆತರೆ ಏನು ಮಾಡಬೇಕು?',
          script: '“ಒಂದು ವೇಳೆ ಮಾತ್ರೆ ಮರೆತರೆ ನೆನಪಾದ ತಕ್ಷಣ ತೆಗೆದುಕೊಳ್ಳಿ. ಆದರೆ ಮುಂದಿನ ಮಾತ್ರೆಯ ಸಮಯ ಹತ್ತಿರವಿದ್ದರೆ ಮರೆತ ಮಾತ್ರೆಯನ್ನು ಬಿಟ್ಟುಬಿಡಿ. ಒಟ್ಟಿಗೆ 2 ಮಾತ್ರೆ ನುಂಗಬೇಡಿ.”',
          actionItem: 'ರೋಗಿಗೆ ಈ ನಿಯಮ ಅರ್ಥವಾಗಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.'
        }
      ]
    }
  ],

  hi: [
    {
      id: 'diabetes_management',
      category: 'मधुमेह (Diabetes)',
      title: 'टाइप 2 मधुमेह प्रबंधन एवं ग्लूकोज नियंत्रण',
      icon: '🩸',
      description: 'रक्त शर्करा नियंत्रण, लक्षण और खान-पान अनुशासन पर संरचित परामर्श गाइड।',
      targetRisk: ['Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'ब्लड शुगर का स्तर समझाएं',
          script: '“नमस्ते [Patient Name]। आज आपका ब्लड शुगर [Glucose] mg/dL है। सामान्य खाली पेट शुगर 70 से 99 mg/dL के बीच होनी चाहिए। शुगर बढ़ने से नसों, आंखों और गुर्दों पर बुरा असर पड़ता है।”',
          actionItem: 'सुनिश्चित करें कि मरीज को अपनी शुगर रिपोर्ट का अर्थ समझ आ गया है।'
        },
        {
          id: 'step_2',
          title: 'चेतावनी लक्षणों को पहचानें',
          script: '“रात में बार-बार पेशाब आना, बहुत ज्यादा प्यास लगना, बहुत कमजोरी या धुंधला दिखाई देने पर हमें तुरंत बताएं। यह शुगर बढ़ने के लक्षण हैं।”',
          actionItem: 'मरीज से पूछें कि क्या इस हफ्ते उन्हें ज्यादा प्यास या थकान महसूस हुई।'
        },
        {
          id: 'step_3',
          title: 'खान-पान में बदलाव',
          script: '“मीठी चाय, कोल्ड ड्रिंक्स और तली हुई चीजों से बचें। सफेद चावल की जगह बाजरा, ज्वार या दलिया खाएं। अपनी आधी थाली हरी सब्जियों से भरें।”',
          actionItem: 'मरीज के नाश्ते और दोपहर के भोजन की समीक्षा करें।'
        },
        {
          id: 'step_4',
          title: 'दवाओं का नियमित सेवन',
          script: '“डॉक्टर द्वारा दी गई मधुमेह की दवाएं हमेशा समय पर लें। ठीक महसूस होने पर भी कभी दवा बंद न करें।”',
          actionItem: 'दवा लेने का समय निर्धारित करें।'
        }
      ]
    },
    {
      id: 'hypertension_control',
      category: 'उच्च रक्तचाप (BP)',
      title: 'हाई ब्लड प्रेशर नियंत्रण एवं नमक में कमी',
      icon: '❤️',
      description: 'नमक कम करने, बीपी की निगरानी और आपातकाल से बचाव का मार्गदर्शन।',
      targetRisk: ['Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'ब्लड प्रेशर रीडिंग समझाएं',
          script: '“आज आपका ब्लड प्रेशर [BP_Systolic]/[BP_Diastolic] mmHg है। इसे 120/80 mmHg के नीचे रखना आपके दिल और दिमाग को सुरक्षित रखता है।”',
          actionItem: 'मरीज को ऊपर और नीचे की रीडिंग का मतलब समझाएं।'
        },
        {
          id: 'step_2',
          title: 'नमक कम करने का नियम',
          script: '“नमक ब्लड प्रेशर को बढ़ाता है। पके खाने में ऊपर से कच्चा नमक न डालें। अचार, पापड़ और नमकीन चीजों से बचें।”',
          actionItem: 'लक्ष्य: पूरे दिन में 1 छोटे चम्मच (5 ग्राम) से कम नमक इस्तेमाल करें।'
        },
        {
          id: 'step_3',
          title: 'खतरे के लक्षण पहचानें',
          script: '“तेज सिरदर्द, चक्कर आना, सीने में भारीपन या सांस फूलने पर तुरंत आशा कार्यकर्ता या स्वास्थ्य केंद्र से संपर्क करें।”',
          actionItem: 'मरीज को नजदीकी स्वास्थ्य केंद्र का नंबर दें।'
        }
      ]
    },
    {
      id: 'diet_nutrition',
      category: 'आहार एवं पोषण',
      title: 'संतुलित एवं पौष्टिक भोजन योजना',
      icon: '🥗',
      description: 'ग्रामीण एवं स्थानीय खान-पान के अनुकूल स्वास्थ्यवर्धक आहार की सलाह।',
      targetRisk: ['Low', 'Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'स्वस्थ थाली का नियम',
          script: '“अपनी थाली को 3 हिस्सों में बांटें: 50% हरी पत्तेदार सब्जियां, 25% दालें या अंडे, और 25% मोटा अनाज (बाजरा, ज्वार, दलिया)।”',
          actionItem: 'स्वस्थ थाली का चित्र दिखाएं।'
        },
        {
          id: 'step_2',
          title: 'खाना पकाने के तेल का नियंत्रण',
          script: '“तले हुए तेल का दोबारा इस्तेमाल न करें। प्रति व्यक्ति प्रति दिन 2-3 चम्मच से अधिक तेल का उपयोग न करें।”',
          actionItem: 'महीने में कितना तेल खर्च होता है, इसकी जानकारी लें।'
        }
      ]
    },
    {
      id: 'exercise_activity',
      category: 'शारीरिक गतिविधि',
      title: 'दैनिक तेज पैदल चाल एवं व्यायाम',
      icon: '🏃',
      description: 'इंसुलिन की सक्रियता बढ़ाने के लिए दैनिक सुरक्षित व्यायाम।',
      targetRisk: ['Low', 'Moderate', 'High'],
      steps: [
        {
          id: 'step_1',
          title: 'रोजाना 30 मिनट तेज चलें',
          script: '“हफ्ते में कम से कम 5 दिन 30 मिनट तेज गति से टहलें। चाल इतनी तेज होनी चाहिए कि आप बात कर सकें लेकिन गा न सकें।”',
          actionItem: 'टहलने के लिए सुरक्षित स्थान तय करें।'
        },
        {
          id: 'step_2',
          title: 'लंबे समय तक बैठने से बचें',
          script: '“काम करते समय या आराम करते समय लगातार न बैठें। हर 45 मिनट बाद 3-5 मिनट खड़े होकर थोड़ा टहलें।”',
          actionItem: 'अलार्म या रिमाइंडर लगाने का सुझाव दें।'
        }
      ]
    },
    {
      id: 'medication_adherence',
      category: 'दवा अनुशासन',
      title: 'दवा लेने का नियम एवं सही तरीका',
      icon: '💊',
      description: 'समय पर दवा लेने और खुराक न छूटने के उपाय।',
      targetRisk: ['Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'दवा को रोज की आदत से जोड़ें',
          script: '“दवा लेने के समय को सुबह की चाय या ब्रश करने की आदत से जोड़ लें, ताकि आप कभी दवा लेना न भूलें।”',
          actionItem: 'मरीज की उपयुक्त आदत पहचानें।'
        },
        {
          id: 'step_2',
          title: 'दवा छूट जाने पर क्या करें?',
          script: '“यदि कोई खुराक छूट जाए तो याद आते ही ले लें। लेकिन यदि अगली खुराक का समय हो चुका हो तो छूटी खुराक छोड़ दें। कभी एक साथ 2 गोलियां न लें।”',
          actionItem: 'इस नियम की समझ की पुष्टि करें।'
        }
      ]
    }
  ],

  mr: [
    {
      id: 'diabetes_management',
      category: 'मधुमेह (Diabetes)',
      title: 'मधुमेह नियंत्रण आणि रक्तातील साखर व्यवस्थापन',
      icon: '🩸',
      description: 'रक्तातील साखर नियंत्रण, लक्षणे आणि आहारातील शिस्त समजावून सांगणारी समुपदेशन मार्गदर्शिका.',
      targetRisk: ['Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'रक्तातील साखर समजावून सांगा',
          script: '“नमस्कार [Patient Name]। आज तुमची रक्तातील साखर [Glucose] mg/dL आहे. सामान्य उपाशी पोटी साखर 70 ते 99 mg/dL दरम्यान असावी. साखर वाढल्याने रक्तवाहिन्या, डोळे आणि मूत्रपिंडांवर ताण येतो.”',
          actionItem: 'रुग्णाला त्यांच्या साखर अहवालाचा अर्थ समजला असल्याची खात्री करा.'
        },
        {
          id: 'step_2',
          title: 'धोक्याची लक्षणे ओळखा',
          script: '“रात्री वारंवार लघवी होणे, खूप जास्त तहान लागणे, तीव्र थकवा किंवा अंधुक दृष्टी आढळल्यास आम्हाला लगेच सांगा.”',
          actionItem: 'या आठवड्यात जास्त तहान किंवा थकवा जाणवला का ते विचारा.'
        },
        {
          id: 'step_3',
          title: 'आहारात बदल आणि साखर बंद',
          script: '“गोड चहा, शीतपेये आणि तळलेले पदार्थ पूर्णपणे टाळा. पांढऱ्या तांदळाऐवजी ज्वारी, बाजरी किंवा नाचणी वापरा. ताटाचा अर्धा भाग हिरव्या भाज्यांनी भरा.”',
          actionItem: 'रुग्णाच्या रोजच्या जेवणाची माहिती घ्या.'
        },
        {
          id: 'step_4',
          title: 'औषधांची नियमितता',
          script: '“डॉक्टरांनी दिलेली औषधे रोज वेळेवर घ्या. बरे वाटत असले तरीही स्वतःहून औषध बंद करू नका.”',
          actionItem: 'औषधांची वेळ निश्चित करा.'
        }
      ]
    },
    {
      id: 'hypertension_control',
      category: 'रक्तदाब (BP)',
      title: 'उच्च रक्तदाब नियंत्रण आणि मीठ कमी करणे',
      icon: '❤️',
      description: 'मीठ कमी करणे, बीपी तपासणी आणि आणीबाणीच्या परिस्थितीपासून बचाव.',
      targetRisk: ['Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'रक्तदाब वाचन समजावून सांगा',
          script: '“आज तुमचा रक्तदाब [BP_Systolic]/[BP_Diastolic] mmHg आहे. रक्तदाब 120/80 mmHg च्या खाली ठेवल्याने हृदय आणि मेंदू सुरक्षित राहतो.”',
          actionItem: 'वरचा आणि खालचा रक्तदाब समजावून सांगा.'
        },
        {
          id: 'step_2',
          title: 'मीठ कमी करण्याचा नियम',
          script: '“मीठ रक्तदाब वाढवते. शिजवलेल्या अन्नावर कच्चे मीठ टाकू नका. लोणचे, पापड आणि खारट पदार्थ टाळा. चवीसाठी लिंबू वापरा.”',
          actionItem: 'दिवसाला 1 चमच्यापेक्षा (5 ग्रॅम) कमी मीठ वापरण्याचे ध्येय ठेवा.'
        },
        {
          id: 'step_3',
          title: 'धोक्याची लक्षणे ओळखा',
          script: '“तीव्र डोकेदुखी, चक्कर येणे, छातीत धडधडणे किंवा श्वास घेण्यास त्रास झाल्यास लगेच आरोग्य केंद्रात जा.”',
          actionItem: 'आरोग्य केंद्राचा संपर्क क्रमांक द्या.'
        }
      ]
    },
    {
      id: 'diet_nutrition',
      category: 'आहार आणि पोषण',
      title: 'संतुलित आणि पौष्टिक स्थानिक आहार',
      icon: '🥗',
      description: 'स्थानिक आणि ग्रामीण सवयींनुसार आरोग्यदायी आहाराच्या टिप्स.',
      targetRisk: ['Low', 'Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'निरोगी ताटाची पद्धत',
          script: '“तुमचे जेवणाचे ताट 3 भागात विभागा: 50% हिरव्या पालेभाज्या, 25% डाळी किंवा अंडी, आणि 25% ज्वारी/बाजरीची भाकरी.”',
          actionItem: 'निरोगी ताटाचे चित्र दाखवा.'
        },
        {
          id: 'step_2',
          title: 'स्वयंपाकाचे तेल नियंत्रित करा',
          script: '“तळलेले तेल पुन्हा वापरू नका. दररोज एका व्यक्तीसाठी 2-3 चमच्यांपेक्षा जास्त तेल वापरू नका.”',
          actionItem: 'घरात महिन्यात किती तेल वापरले जाते ते तपासा.'
        }
      ]
    },
    {
      id: 'exercise_activity',
      category: 'शारीरिक व्यायाम',
      title: 'रोजचा वेगवान चालण्याचा व्यायाम',
      icon: '🏃',
      description: 'इन्सुलिनची कार्यक्षमता सुधारण्यासाठी सुरक्षित व्यायाम.',
      targetRisk: ['Low', 'Moderate', 'High'],
      steps: [
        {
          id: 'step_1',
          title: 'रोज 30 मिनिटे वेगाने चाला',
          script: '“आठवड्यातून किमान 5 दिवस 30 मिनिटे वेगाने चाला. तुम्ही बोलू शकाल पण गाऊ शकणार नाही इतक्या वेगाने चालले पाहिजे.”',
          actionItem: 'चालण्यासाठी सुरक्षित रस्ता सुचवा.'
        },
        {
          id: 'step_2',
          title: 'दीर्घकाळ बसणे टाळा',
          script: '“कामाच्या वेळी किंवा विश्रांती घेताना सतत बसू नका. दर 45 मिनिटांनी उठून 3-5 मिनिटे फिरा.”',
          actionItem: 'वेळेचे स्मरणपत्र लावण्याचा सल्ला द्या.'
        }
      ]
    },
    {
      id: 'medication_adherence',
      category: 'औषध शिस्त',
      title: 'गोळ्या वेळेवर घेण्याची सवय',
      icon: '💊',
      description: 'गोळ्यांची वेळ न विसरण्यासाठी सवयींची जोड.',
      targetRisk: ['Moderate', 'High', 'Critical'],
      steps: [
        {
          id: 'step_1',
          title: 'गोळी दैनंदिन सवयीशी जोडा',
          script: '“गोळी घेण्याची वेळ सकाळच्या चहाशी किंवा ब्रश करण्याशी जोडून घ्या, जेणेकरून तुम्ही कधीही विसरणार नाही.”',
          actionItem: 'रुग्णाची योग्य सवय ओळखा.'
        },
        {
          id: 'step_2',
          title: 'गोळी चुकल्यास काय करावे?',
          script: '“गोळी घेण्याचे विसरल्यास आठवताच घ्या. पण पुढील गोळीची वेळ जवळ आली असल्यास जुनी गोळी सोडून द्या. एकाच वेळी 2 गोळ्या घेऊ नका.”',
          actionItem: 'या नियमाची खात्री करा.'
        }
      ]
    }
  ]
};

export const THINKLETS_SCRIPTS = LOCALIZED_SCRIPTS.en;

export function getLocalizedThinkLetsScripts(language = 'en') {
  return LOCALIZED_SCRIPTS[language] || LOCALIZED_SCRIPTS.en;
}
