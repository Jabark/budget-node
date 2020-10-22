import { Router, Request, Response } from 'express';
import { ExpensesRepository } from './expenses.repository';
import { InMemoryExpensesRepository } from './in-memory-expenses.repository';
import { buildPeriodFromRequest } from '../../utils/controller.utils';
import { expenseBelongsToAccount } from './expenses.middleware';
import { readerOnlyReads } from '../auth/role.middleware';
import expensesValidator from './expenses.validator';
import { User } from '../../models/user';

const repository: ExpensesRepository = new InMemoryExpensesRepository(); // TODO use DI container
const router = Router();

router.use('/expenses', readerOnlyReads());

router.get('/expenses', function (req: Request, res: Response) {
  const user = req.user as User;
  const period = buildPeriodFromRequest(req);
  const categoryQuery = req.query.categoryName;

  if (!categoryQuery) {
    repository.getExpenses(user.accountId as string, period).then(expenses => res.json(expenses));
  } else {
    repository.getExpensesByCategory(user.accountId as string, period, categoryQuery)
      .then(expenses => res.json(expenses));
  }
});

router.post('/expenses', expensesValidator, function (req: Request, res: Response) {
  const user = req.user as User;
  const expense = req.body;
  expense.accountId = user.accountId;

  repository.createExpense(expense)
    .then(() => res.status(201).json());
});

router.put('/expenses/:id', expenseBelongsToAccount(), expensesValidator, function (req: Request, res: Response) {
  const user = req.user as User;
  const expense = req.body;
  expense.id = req.params.id;
  expense.accountId = user.accountId;

  repository.updateExpense(expense)
    .then(() => res.status(200).json());
});

router.delete('/expenses/:id', expenseBelongsToAccount(), function (req: Request, res: Response) {
  const expenseId = req.params.id;
  repository.deleteExpense(expenseId)
    .then(() => res.sendStatus(204));
});

export default router;