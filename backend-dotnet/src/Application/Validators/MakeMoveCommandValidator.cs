using FluentValidation;
using Application.Features.Games.Commands.MakeMove;

namespace Application.Validators;

public class MakeMoveCommandValidator : AbstractValidator<MakeMoveCommand>
{
    public MakeMoveCommandValidator()
    {
        RuleFor(x => x.GameId)
            .NotEmpty().WithMessage("Oyun ID boş olamaz");

        RuleFor(x => x.PlayerId)
            .NotEmpty().WithMessage("Oyuncu ID boş olamaz");

        RuleFor(x => x.Number)
            .InclusiveBetween(1, 7).WithMessage("Kart numarası 1-7 arasında olmalıdır");
    }
}
