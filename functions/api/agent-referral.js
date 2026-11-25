import agentReferrals from '../_lib/agent-referrals.js';
import { handleLeadPost } from '../_lib/lead-post.js';

export const onRequestPost = context => handleLeadPost(context, agentReferrals);
