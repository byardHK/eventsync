export const FetchExistingUserTS = async (email, setUserDetails) => {
    try {
        const res = await axios.get(`http://localhost:5000/api/get_user/${email}`);
        console.log("Fetched user data: (load user)", res.data);

        setUserDetails(prevDetails => {
            const updatedDetails = {
                ...prevDetails,
                firstName: res.data[0].fname,
                lastName: res.data[0].lname,
                email: res.data[0].id,
                isAdmin: res.data[0].isAdmin,
                isBanned: res.data[0].isBanned,
                isPublic: res.data[0].isPublic,
                bio: res.data[0].bio,
                notificationFrequency: res.data[0].notificationFrequency,
                notificationId: res.data[0].notificationId,
                numTimesReported: res.data[0].numTimesReported,
                profilePicture: res.data[0].profilePicture,
                friendRequest: res.data[0].friendRequest,
                eventInvite: res.data[0].eventInvite,
                eventCancelled: res.data[0].eventCancelled,
            };
            return updatedDetails;
        });
        
    } catch (error) {
        console.error("Error retrieving user details from database or setting them internally:", error);
    }
  };