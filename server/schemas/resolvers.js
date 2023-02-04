const {User, Book} = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const user = await User.findOne({_id: context.user._id});
                return user
            }
            throw new AuthenticationError('You are not logged in!');
        }
    },
    Mutation: {
        addUser: async(parent, {username, email, password}) => {
            const user = await User.create({username, email, password});
            const token = signToken(user);
            return {token, user};
        },
        login: async(parent, {email, password}) => {
            const user = await User.findOne({email});
            if (!user) {
                throw new AuthenticationError('User not found!');
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Incorrect Password!');
            }
            const token = signToken(user);
            return {token, user}
        },
        saveBook: async (parent, {book}, context) => {
            if (context.user) {
                const updateUser = await User.findOneAndUpdate(
                    {_id: context.user._id},
                    {$addToSet: {savedBooks: book}},
                    {new: true}
                );
                return updateUser;
            }
            throw new AuthenticationError('Not logged in!')
        },
        removeBook: async(parent, {bookId}, context) => {
            if (context.user) {
                const updateUser = await User.findOneAndUpdate(
                    {_id: context.user._id},
                    {$pull: {savedBooks: {bookId: bookId}}},
                    {new: true}
                );
                return updateUser;
                // saved book is an object of books so must navigate down one more level to get bookId
            }
            throw new AuthenticationError('Not logged in!');
        }
    }
}

module.exports = resolvers;