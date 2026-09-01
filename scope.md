Act as an expert Python Web Developer.

Please write a complete Python script using Streamlit to create a web-based calculator for the "NIOSH Lifting Equation".

1. Mathematical Formulas & Logic:

Constant: LC (Load Constant) = 23 kg.

RWL (Recommended Weight Limit) Equation: RWL = LC * HM * VM * DM * AM * FM * CM

LI (Lifting Index) Equation: LI = Object weight / RWL

2. User Interface & Input Fields:
Create a clean sidebar or main layout for the user to input the following variables:

Object weight: Numeric input for the weight of the object in kilograms.

HM (Horizontal Multiplier): Numeric input (0.00 to 1.00).

VM (Vertical Multiplier): Numeric input (0.00 to 1.00).

DM (Distance Multiplier): Numeric input (0.00 to 1.00).

AM (Asymmetric Multiplier): Numeric input (0.00 to 1.00).

FM (Frequency Multiplier): Numeric input (0.00 to 1.00).

CM (Coupling Multiplier): Numeric input (0.00 to 1.00).

3. Output & Interpretation (in Thai):
Display the calculated RWL and LI clearly using st.metric or styled text.
Implement conditional logic to evaluate the LI score and display a specific Thai message with an appropriate background color (using st.success, st.warning, or st.error):

If LI < 1: Display "ไม่ต้องมีการปรับปรุงแก้ไข" (Green/Success).

If 1 <= LI < 3: Display "ต้องมีการปรับปรุงงาน/วิธีการทำงาน" (Yellow/Warning).

If LI >= 3: Display "ห้ามปฏิบัติงานนั้นๆ จนกว่าจะได้รับการแก้ไข" (Red/Error).

4. Styling & Layout:

Set the page title to "NIOSH Lifting Equation Calculator".

Ensure the layout is user-friendly and the code is well-commented and ready to run via streamlit run app.py.