import { useTranslation } from "react-i18next";

const UseRouteAssistant = () => {
  const { t } = useTranslation();

  const routeText = {
    // Auth routes
    login: t(
      "If you already have an account, enter your email and password. If you're a new user, click on 'Register' to create your account."
    ),
    register: t(
      "Enter your details to create an account. If you already have an account, click on Login"
    ),
    registerTeacher: t(
      "Enter your details to create a teacher account. If you already have an account, click on Login"
    ),
    registerParent: t(
      "Enter your details to create a parent account. If you already have an account, click on Login"
    ),
    role: t(
      "Congratulation you have successfully created an account. Please select your role to continue."
    ),

    // Parent routes
    home: t(
      "Welcome to your dashboard! Here you can manage all parent features and access your child's information."
    ),
    profile: t(
      "Here you can view and edit your profile details, manage preferences and update your information."
    ),

    // Parent classroom routes
    classroomIndex: t(
      "Here you can view your child's classroom information, assignments and progress."
    ),
    remarks: t(
      "Here you can view teacher remarks and feedback for your child."
    ),

    // Parent tabs routes
    chatBot: t(
      "You can chat with our assistant here. It will help you with queries related to your child's education."
    ),
    learningVideo: t(
      "Here you can access educational videos for your child's learning journey."
    ),

    // Additional parent routes from your list
    classroomIndex: t(
      "Please verify your details. After verification, click on the checkbox and Submit."
    ),
  };

  return routeText;
};

export default UseRouteAssistant;
