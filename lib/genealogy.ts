import User, { IUser } from '@/models/User';
import mongoose from 'mongoose';

/**
 * Get the genealogy path (sponsor chain) for a user up to 20 levels
 */
export async function getGenealogyPath(
  userId: mongoose.Types.ObjectId,
  maxLevel: number = 20
): Promise<Array<{ user: IUser; level: number }>> {
  const path: Array<{ user: IUser; level: number }> = [];
  let currentUserId: mongoose.Types.ObjectId | undefined = userId;
  let level = 0;

  while (currentUserId && level <= maxLevel) {
    const user: IUser | null = await User.findById(currentUserId).select(
      '-password'
    );
    if (!user) break;

    path.push({ user, level });
    currentUserId = user.sponsorId;
    level++;
  }

  return path;
}

/**
 * Get all users in the downline (users sponsored by this user and their downlines)
 */
export async function getDownline(
  userId: mongoose.Types.ObjectId,
  maxDepth: number = 20
): Promise<Array<{ user: IUser; level: number }>> {
  const downline: Array<{ user: IUser; level: number }> = [];

  async function traverse(userId: mongoose.Types.ObjectId, depth: number) {
    if (depth > maxDepth) return;

    const directDownline = await User.find({ sponsorId: userId }).select(
      '-password'
    );

    for (const user of directDownline) {
      downline.push({ user, level: depth });
      await traverse(user._id, depth + 1);
    }
  }

  await traverse(userId, 1);
  return downline;
}

/**
 * Get direct referrals (level 1 downline)
 */
export async function getDirectReferrals(
  userId: mongoose.Types.ObjectId
): Promise<IUser[]> {
  return User.find({ sponsorId: userId }).select('-password');
}

/**
 * Get the journey path from a target user to the current user
 * Shows how the target user became part of the current user's downline
 */
export async function getDownlineJourney(
  currentUserId: mongoose.Types.ObjectId,
  targetUserId: mongoose.Types.ObjectId
): Promise<Array<{ user: IUser; level: number }> | null> {
  // First, verify that targetUser is actually in currentUser's downline
  const allDownline = await getDownline(currentUserId);
  const isInDownline = allDownline.some(
    (item) => item.user._id.toString() === targetUserId.toString()
  );

  if (!isInDownline) {
    return null; // Target user is not in the downline
  }

  // Build the path from target user up to current user
  const journey: Array<{ user: IUser; level: number }> = [];
  let currentTargetId: mongoose.Types.ObjectId | undefined = targetUserId;

  while (currentTargetId) {
    const user: IUser | null = await User.findById(currentTargetId).select(
      '-password'
    );
    if (!user) break;

    // Determine the level - current user is level 0, others are from downline list
    let level: number;
    if (user._id.toString() === currentUserId.toString()) {
      level = 0; // Current user is always level 0
    } else {
      const downlineItem = allDownline.find(
        (item) => item.user._id.toString() === user._id.toString()
      );
      level = downlineItem ? downlineItem.level : 0;
    }

    journey.push({ user, level });
    
    // Stop if we've reached the current user
    if (user._id.toString() === currentUserId.toString()) {
      break;
    }

    // If no sponsor, we can't go further
    if (!user.sponsorId) break;

    currentTargetId = user.sponsorId;
  }

  // Reverse to show from current user (level 0) to target user
  return journey.reverse();
}

/**
 * Get tree structure of downline
 */
export interface TreeNode {
  user: IUser;
  level: number;
  children: TreeNode[];
}

export async function getDownlineTree(
  userId: mongoose.Types.ObjectId,
  maxDepth: number = 5
): Promise<TreeNode | null> {
  const rootUser = await User.findById(userId).select('-password');
  if (!rootUser) return null;

  const root: TreeNode = {
    user: rootUser,
    level: 0,
    children: [],
  };

  async function buildNode(parentUserId: mongoose.Types.ObjectId, depth: number): Promise<TreeNode[]> {
    if (depth > maxDepth) return [];

    const directDownline = await User.find({ sponsorId: parentUserId }).select('-password');
    const nodes: TreeNode[] = [];

    for (const user of directDownline) {
      const node: TreeNode = {
        user,
        level: depth,
        children: [],
      };
      node.children = await buildNode(user._id, depth + 1);
      nodes.push(node);
    }

    return nodes;
  }

  root.children = await buildNode(userId, 1);
  return root;
}

