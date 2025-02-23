// import axios from 'axios';
// import { useUser } from "../sso/UserContext";

// const { setUserDetails } = useUser();


// export const FetchExistingUser = async (email) => {
//     try {
//         console.log(`📥 Fetching existing user data for: ${email}`);
//         console.log("inside  Fetch user! 393")
//         const res = await axios.get(`http://localhost:5000/api/get_user/${email}`);
//         console.log('📊 Existing user data:', res);

//         setUserDetails({
//             isOnboardingComplete: true,
//             firstName: res.data[0].fname,
//             lastName: res.data[0].lname,
//             email: res.data[0].id,
//             isAdmin: res.data[0].isAdmin,
//             isBanned: res.data[0].isBanned,
//             isPublic: res.data[0].isPublic,
//             bio: res.data[0].bio,
//             notificationFrequency: res.data[0].notificationFrequency,
//             notificationId: res.data[0].notificationId,
//             numTimesReported: res.data[0].numTimesReported,
//             profilePicture: res.data[0].profilePicture,
//             friendRequest: res.data[0].friendRequest,
//             eventInvite: res.data[0].eventInvite,
//             eventCancelled: res.data[0].eventCancelled,
//         });
//     } catch (error) {
//         console.error('❌ Error fetching existing user details:', error);
//     }
// };