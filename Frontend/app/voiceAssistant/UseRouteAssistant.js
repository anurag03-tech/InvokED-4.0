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
    role: t("Let's get started by selecting between 'Parent' and 'Teacher'."),

    // Parent routes
    home: t(
      "Welcome to your dashboard! Here, you can view your child's timetable, attendance, and classroom information by clicking on the respective buttons."
    ),
    profile: t("You can view your profile details and parenting tips."),

    // Parent classroom routes
    classroomIndex: t(
      "You can view assignments, announcements, marks, and feedback from the teacher."
    ),
    remarks: t(
      "Here you can view teacher remarks and feedback for your child, and send a response"
    ),

    // Parent tabs routes
    chatBot: t(
      "You can chat with our assistant here. It will help you with your queries."
    ),
    learning: t("You can access learning videos and audio content from here"),
    notifications: t(
      "You will get all important notifications about announcements and assignments from the teacher here"
    ),
  };

  return routeText;
};

export default UseRouteAssistant;
