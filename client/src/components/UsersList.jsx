import { Box, HStack, VStack, Text, Avatar, Tooltip } from "@chakra-ui/react";

const UsersList = ({ users, roomId, currentSocketId }) => {
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  return (
    <Box
      bg="rgba(255,255,255,0.02)"
      border="1px solid rgba(255,255,255,0.06)"
      borderRadius="xl"
      px={4}
      py={3}
      mb={4}
    >
      <HStack justify="space-between" align="center">
        {/* Users */}
        <HStack spacing={2} flex={1} flexWrap="wrap">
          {users.map((user) => {
            const isMe = user.id === currentSocketId;
            return (
              <Tooltip
                key={user.id}
                label={`${user.username}${isMe ? " (Tu)" : ""}`}
                placement="bottom"
                hasArrow
                bg="gray.800"
                color="white"
                fontSize="xs"
                fontFamily="mono"
              >
                <HStack
                  spacing={1.5}
                  bg="rgba(255,255,255,0.04)"
                  border={`1px solid ${user.color}33`}
                  borderRadius="full"
                  px={2.5}
                  py={1}
                  cursor="default"
                >
                  <Box
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    bg={user.color}
                    boxShadow={`0 0 6px ${user.color}`}
                  />
                  <Text
                    color={isMe ? "white" : "gray.400"}
                    fontSize="xs"
                    fontFamily="mono"
                    fontWeight={isMe ? "600" : "400"}
                    maxW="80px"
                    noOfLines={1}
                  >
                    {isMe ? `${user.username} ★` : user.username}
                  </Text>
                </HStack>
              </Tooltip>
            );
          })}
        </HStack>

        {/* Room ID */}
        <Tooltip label="Click to copy" placement="bottom" hasArrow bg="gray.800" fontSize="xs">
          <HStack
            spacing={2}
            cursor="pointer"
            onClick={copyRoomId}
            bg="rgba(78, 205, 196, 0.08)"
            border="1px solid rgba(78, 205, 196, 0.2)"
            borderRadius="lg"
            px={3}
            py={1.5}
            _hover={{ bg: "rgba(78, 205, 196, 0.15)" }}
            transition="all 0.2s"
            flexShrink={0}
          >
            <Text color="gray.500" fontSize="10px" fontFamily="mono" letterSpacing="1px">
              ROOM
            </Text>
            <Text
              color="#4ECDC4"
              fontSize="sm"
              fontFamily="mono"
              fontWeight="700"
              letterSpacing="2px"
            >
              {roomId}
            </Text>
          </HStack>
        </Tooltip>
      </HStack>
    </Box>
  );
};

export default UsersList;
